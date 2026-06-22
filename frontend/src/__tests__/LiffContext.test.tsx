import { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const liffMock = vi.hoisted(() => ({
  use: vi.fn(),
  init: vi.fn(),
  isLoggedIn: vi.fn(),
  login: vi.fn(),
  getProfile: vi.fn(),
  getContext: vi.fn(),
  getIDToken: vi.fn(),
  getDecodedIDToken: vi.fn(),
}));

vi.mock('@line/liff', () => ({
  default: liffMock,
}));

async function renderStateProbe() {
  const [{ LiffProvider }, { LiffContext }] = await Promise.all([
    import('../contexts/LiffContext'),
    import('../contexts/liff-context'),
  ]);

  function StateProbe() {
    const state = useContext(LiffContext);

    return (
      <div>
        <div data-testid="ready">{String(state.ready)}</div>
        <div data-testid="loading">{String(state.loading)}</div>
        <div data-testid="error">{state.error ?? ''}</div>
        <div data-testid="auth-redirecting">{String(state.authRedirecting)}</div>
        <div data-testid="profile-name">{state.profile?.displayName ?? ''}</div>
        <div data-testid="profile-user-id">{state.profile?.userId ?? ''}</div>
        <div data-testid="group-id">{state.groupId ?? ''}</div>
        <div data-testid="id-token">{state.idToken ?? ''}</div>
      </div>
    );
  }

  render(
    <LiffProvider>
      <StateProbe />
    </LiffProvider>
  );
}

describe('LiffProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    vi.stubEnv('VITE_LIFF_ID', '2010457997-AsUbpde2');
    vi.stubEnv('VITE_LIFF_DEV', 'false');

    liffMock.init.mockResolvedValue(undefined);
    liffMock.isLoggedIn.mockReturnValue(true);
    liffMock.login.mockReturnValue(undefined);
    liffMock.getContext.mockReturnValue({ type: 'group', groupId: 'C36f826d26cf8adefe4d214993742c230' });
    liffMock.getIDToken.mockReturnValue('mock-id-token');
    liffMock.getDecodedIDToken.mockReturnValue({
      sub: 'Udecoded1',
      name: 'Decoded User',
      picture: 'https://example.com/picture.jpg',
    });
    liffMock.getProfile.mockResolvedValue({
      userId: 'Uprofile1',
      displayName: 'Profile User',
      pictureUrl: 'https://example.com/profile.jpg',
      statusMessage: 'hello',
    });
  });

  it('falls back to decoded ID token when getProfile is unavailable', async () => {
    liffMock.getProfile.mockRejectedValue(new Error('profile unavailable'));

    await renderStateProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Decoded User');
    expect(screen.getByTestId('profile-user-id')).toHaveTextContent('Udecoded1');
    expect(screen.getByTestId('group-id')).toHaveTextContent('C36f826d26cf8adefe4d214993742c230');
    expect(screen.getByTestId('id-token')).toHaveTextContent('mock-id-token');
    expect(screen.getByTestId('auth-redirecting')).toHaveTextContent('false');
  });

  it('surfaces the LIFF error code and message when init fails', async () => {
    const initError = Object.assign(new Error('Environment unsupported'), { code: 'FORBIDDEN' });
    liffMock.init.mockRejectedValue(initError);

    await renderStateProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('ready')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('FORBIDDEN: Environment unsupported');
  });

  it('uses a valid LINE room id as the live entry context', async () => {
    liffMock.getContext.mockReturnValue({ type: 'room', roomId: 'R36f826d26cf8adefe4d214993742c230' });

    await renderStateProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
    expect(screen.getByTestId('group-id')).toHaveTextContent('R36f826d26cf8adefe4d214993742c230');
  });

  it('ignores unstable non-LINE context ids in production mode', async () => {
    liffMock.getContext.mockReturnValue({ type: 'group', groupId: '0559b5ee-5dbb-477e-ba0d-8452cd69faed' });

    await renderStateProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
    expect(screen.getByTestId('group-id')).toHaveTextContent('');
  });

  it('surfaces a recoverable message instead of staying stuck when LINE login is required', async () => {
    liffMock.isLoggedIn.mockReturnValue(false);

    await renderStateProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('ready')).toHaveTextContent('false');
    expect(screen.getByTestId('auth-redirecting')).toHaveTextContent('true');
    expect(screen.getByTestId('error')).toHaveTextContent('需要 LINE 登入才能開啟喝水頁面');
    expect(liffMock.login).toHaveBeenCalledWith({ redirectUri: window.location.href });
  });

  it('uses dev fallback profile and group context when VITE_LIFF_DEV is true', async () => {
    vi.stubEnv('VITE_LIFF_DEV', 'true');

    await renderStateProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Dev User');
    expect(screen.getByTestId('group-id')).toHaveTextContent('Cdev1');
    expect(screen.getByTestId('id-token')).toHaveTextContent('dev-mock-id-token');
  });

  it('sets no group when the no_group mock preset is active', async () => {
    vi.stubEnv('VITE_LIFF_DEV', 'true');
    window.history.replaceState(null, '', '/liff/water?mockPreset=no_group');

    await renderStateProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
    expect(screen.getByTestId('group-id')).toHaveTextContent('');
  });
});
