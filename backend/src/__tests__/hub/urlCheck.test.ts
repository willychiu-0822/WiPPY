import { checkPublicUrl, isPrivateAddress } from '../../hub/urlCheck';
import { jsonResponse, makeTestHub, type TestHub } from './helpers';

function head(status: number, headers: Record<string, string> = {}) {
  return new Response(null, { status, headers });
}

describe('isPrivateAddress', () => {
  it.each(['10.0.0.1', '127.0.0.1', '169.254.169.254', '172.16.5.4', '192.168.1.1', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1'])('blocks %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });
  it.each(['93.184.216.34', '8.8.8.8', '2606:4700::1111'])('allows %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe('checkPublicUrl', () => {
  let hub: TestHub;
  beforeEach(() => { hub = makeTestHub(); });

  it('accepts a reachable https page and reports content type', async () => {
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'text/html' }));
    expect(await checkPublicUrl(hub, 'https://grok.example/page/1', 'page')).toEqual({ ok: true, url: 'https://grok.example/page/1', contentType: 'text/html', size: null });
    const [, init] = hub.fetchMock.mock.calls[0];
    expect(init.method).toBe('HEAD');
    expect(init.redirect).toBe('manual');
    expect(init.headers?.Authorization).toBeUndefined();
  });

  it('rejects malformed, non-https and overly long URLs without any request', async () => {
    expect(await checkPublicUrl(hub, 'not a url', 'page')).toMatchObject({ ok: false, code: 'url_invalid' });
    expect(await checkPublicUrl(hub, 'http://grok.example/a', 'page')).toMatchObject({ ok: false, code: 'url_not_https' });
    expect(await checkPublicUrl(hub, `https://grok.example/${'a'.repeat(1001)}`, 'page')).toMatchObject({ ok: false, code: 'url_too_long' });
    expect(hub.fetchMock).not.toHaveBeenCalled();
  });

  it('blocks hosts that resolve to private or metadata addresses (SSRF)', async () => {
    hub.resolveHostMock.mockResolvedValueOnce(['10.1.2.3']);
    expect(await checkPublicUrl(hub, 'https://intranet.example/a', 'page')).toMatchObject({ ok: false, code: 'url_private_address' });
    expect(await checkPublicUrl(hub, 'https://127.0.0.1/a', 'page')).toMatchObject({ ok: false, code: 'url_private_address' });
    expect(await checkPublicUrl(hub, 'https://metadata.google.internal/a', 'page')).toMatchObject({ ok: false, code: 'url_private_address' });
    expect(hub.fetchMock).not.toHaveBeenCalled();
  });

  it('reports pages that need a login or are gone', async () => {
    hub.fetchMock.mockResolvedValue(head(401));
    expect(await checkPublicUrl(hub, 'https://grok.example/private', 'page')).toMatchObject({ ok: false, code: 'url_requires_login' });
    hub.fetchMock.mockResolvedValue(head(404));
    expect(await checkPublicUrl(hub, 'https://grok.example/gone', 'page')).toMatchObject({ ok: false, code: 'url_unreachable', detail: expect.stringContaining('404') });
  });

  it('falls back to a 1-byte ranged GET when HEAD is not allowed, reading the size from Content-Range', async () => {
    hub.fetchMock
      .mockResolvedValueOnce(head(405))
      .mockResolvedValueOnce(head(206, { 'content-type': 'image/png', 'content-range': 'bytes 0-0/2048' }));
    expect(await checkPublicUrl(hub, 'https://cdn.example/a.png', 'image')).toEqual({ ok: true, url: 'https://cdn.example/a.png', contentType: 'image/png', size: 2048 });
    expect(hub.fetchMock.mock.calls[1][1]).toMatchObject({ method: 'GET', headers: { Range: 'bytes=0-0' } });
  });

  it('follows redirects but re-checks every hop', async () => {
    hub.fetchMock
      .mockResolvedValueOnce(head(302, { location: 'https://cdn.example/final.jpg' }))
      .mockResolvedValueOnce(head(200, { 'content-type': 'image/jpeg', 'content-length': '100' }));
    expect(await checkPublicUrl(hub, 'https://short.example/x', 'image')).toMatchObject({ ok: true, url: 'https://short.example/x', size: 100 });

    hub.fetchMock.mockResolvedValueOnce(head(302, { location: 'http://insecure.example/a' }));
    expect(await checkPublicUrl(hub, 'https://short.example/y', 'page')).toMatchObject({ ok: false, code: 'url_not_https' });

    hub.fetchMock.mockResolvedValueOnce(head(301, { location: 'https://evil.example/' }));
    hub.resolveHostMock.mockResolvedValueOnce(['93.184.216.34']).mockResolvedValueOnce(['192.168.0.10']);
    expect(await checkPublicUrl(hub, 'https://short.example/z', 'page')).toMatchObject({ ok: false, code: 'url_private_address' });
  });

  it('enforces LINE media types and sizes', async () => {
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'text/html' }));
    expect(await checkPublicUrl(hub, 'https://grok.example/share/1', 'image')).toMatchObject({ ok: false, code: 'url_wrong_type', detail: expect.stringContaining('image/jpeg') });
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'image/jpeg', 'content-length': String(11 * 1024 * 1024) }));
    expect(await checkPublicUrl(hub, 'https://cdn.example/huge.jpg', 'image')).toMatchObject({ ok: false, code: 'url_too_large' });
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'image/jpeg', 'content-length': String(2 * 1024 * 1024) }));
    expect(await checkPublicUrl(hub, 'https://cdn.example/p.jpg', 'preview')).toMatchObject({ ok: false, code: 'url_too_large' });
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'video/mp4; codecs=avc1', 'content-length': '5000' }));
    expect(await checkPublicUrl(hub, 'https://cdn.example/v.mp4', 'video')).toMatchObject({ ok: true });
    hub.fetchMock.mockResolvedValueOnce(head(200, { 'content-type': 'audio/x-m4a' }));
    expect(await checkPublicUrl(hub, 'https://cdn.example/a.m4a', 'audio')).toMatchObject({ ok: true, size: null });
  });

  it('reports timeouts and network errors as unreachable', async () => {
    hub.fetchMock.mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    expect(await checkPublicUrl(hub, 'https://slow.example/', 'page')).toMatchObject({ ok: false, code: 'url_timeout' });
    hub.fetchMock.mockRejectedValueOnce(new Error('ENOTFOUND'));
    expect(await checkPublicUrl(hub, 'https://nx.example/', 'page')).toMatchObject({ ok: false, code: 'url_unreachable' });
    void jsonResponse;
  });
});
