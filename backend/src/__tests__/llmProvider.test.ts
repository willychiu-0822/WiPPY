// ── LLMProvider tests ──────────────────────────────────────────────────────────

// We test the factory and provider classes by mocking global fetch.

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { createLLMProvider, getLLMConfigStatus } from '../services/llmProvider';

function mockOkResponse(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

function mockErrorResponse(status: number, text: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => text,
  });
}

beforeEach(() => {
  mockFetch.mockClear();
  // Reset env vars to defaults
  delete process.env.LLM_PROVIDER;
  delete process.env.LLM_MODEL;
  delete process.env.LLM_API_KEY;
  delete process.env.LLM_BASE_URL;
});

describe('createLLMProvider — factory', () => {
  beforeEach(() => {
    // OpenAI-compatible providers require these env vars
    process.env.LLM_BASE_URL = 'https://api.test.com/v1';
    process.env.LLM_API_KEY = 'test_key';
    process.env.LLM_MODEL = 'test-model';
  });

  it('defaults to openai_compatible provider', () => {
    const provider = createLLMProvider();
    expect(typeof provider.chat).toBe('function');
  });

  it('creates ollama provider when LLM_PROVIDER=ollama', () => {
    process.env.LLM_PROVIDER = 'ollama';
    const provider = createLLMProvider();
    expect(typeof provider.chat).toBe('function');
  });

  it('creates OpenAI-compatible provider for anthropic/openai/nvidia', () => {
    for (const p of ['anthropic', 'openai', 'nvidia']) {
      process.env.LLM_PROVIDER = p;
      const provider = createLLMProvider();
      expect(typeof provider.chat).toBe('function');
    }
  });

  it('reports missing config for default openai-compatible provider', () => {
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_MODEL;

    expect(() => createLLMProvider()).toThrow(
      'LLM configuration error: provider "openai_compatible" is not configured. Missing LLM_BASE_URL, LLM_API_KEY, LLM_MODEL.'
    );
  });

  it('treats ollama as configured with default local endpoint', () => {
    process.env.LLM_PROVIDER = 'ollama';
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_MODEL;

    expect(getLLMConfigStatus()).toEqual({
      provider: 'ollama',
      missingEnv: [],
      isConfigured: true,
    });
  });
});

describe('OpenAI-compatible provider (nvidia)', () => {
  beforeEach(() => {
    process.env.LLM_PROVIDER = 'nvidia';
    process.env.LLM_API_KEY = 'test_key';
    process.env.LLM_BASE_URL = 'https://api.test.com/v1';
    process.env.LLM_MODEL = 'test-model';
  });

  it('returns assistant message content on success', async () => {
    mockOkResponse({
      choices: [{ message: { content: '這是 AI 的回覆' } }],
    });

    const provider = createLLMProvider();
    const result = await provider.chat([{ role: 'user', content: '你好' }]);
    expect(result).toBe('這是 AI 的回覆');
  });

  it('sends correct Authorization header', async () => {
    mockOkResponse({
      choices: [{ message: { content: 'ok' } }],
    });

    const provider = createLLMProvider();
    await provider.chat([{ role: 'user', content: 'test' }]);

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer test_key'
    );
  });

  it('sends to correct endpoint', async () => {
    mockOkResponse({ choices: [{ message: { content: 'ok' } }] });

    const provider = createLLMProvider();
    await provider.chat([{ role: 'user', content: 'test' }]);

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test.com/v1/chat/completions');
  });

  it('throws on non-OK response', async () => {
    mockErrorResponse(429, 'Rate limit exceeded');
    const provider = createLLMProvider();
    await expect(
      provider.chat([{ role: 'user', content: 'test' }])
    ).rejects.toThrow('LLM API error 429');
  });

  it('throws when choices array is empty', async () => {
    mockOkResponse({ choices: [] });
    const provider = createLLMProvider();
    await expect(
      provider.chat([{ role: 'user', content: 'test' }])
    ).rejects.toThrow('LLM returned empty response');
  });
});

describe('Ollama provider', () => {
  beforeEach(() => {
    process.env.LLM_PROVIDER = 'ollama';
    process.env.LLM_BASE_URL = 'http://localhost:11434';
    process.env.LLM_MODEL = 'llama3.1';
  });

  it('returns message content on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: { content: 'Ollama 回覆' } }),
    });

    const provider = createLLMProvider();
    const result = await provider.chat([{ role: 'user', content: 'test' }]);
    expect(result).toBe('Ollama 回覆');
  });

  it('sends to Ollama chat endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: { content: 'ok' } }),
    });

    const provider = createLLMProvider();
    await provider.chat([{ role: 'user', content: 'test' }]);

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/api/chat');
  });

  it('sends stream: false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: { content: 'ok' } }),
    });

    const provider = createLLMProvider();
    await provider.chat([{ role: 'user', content: 'test' }]);

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.stream).toBe(false);
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    });
    const provider = createLLMProvider();
    await expect(
      provider.chat([{ role: 'user', content: 'test' }])
    ).rejects.toThrow('Ollama error 500');
  });
});
