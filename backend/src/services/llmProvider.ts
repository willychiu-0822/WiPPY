import { GoogleGenAI } from '@google/genai';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProvider {
  chat(messages: LLMMessage[]): Promise<string>;
}

export interface LLMConfigStatus {
  provider: string;
  missingEnv: string[];
  isConfigured: boolean;
}

// ─── NVIDIA / OpenAI-compatible provider ─────────────────────────────────────

class OpenAICompatibleProvider implements LLMProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async chat(messages: LLMMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error('LLM returned empty response');
    return content;
  }
}

// ─── Ollama provider ──────────────────────────────────────────────────────────

class OllamaProvider implements LLMProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string
  ) {}

  async chat(messages: LLMMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as {
      message: { content: string };
    };
    const content = data.message?.content;
    if (!content) throw new Error('Ollama returned empty response');
    return content;
  }
}

// ─── Vertex AI (Gemini) provider ─────────────────────────────────────────────

class VertexAIProvider implements LLMProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor(projectId: string, location: string, model: string) {
    this.ai = new GoogleGenAI({ vertexai: true, project: projectId, location });
    this.model = model;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system');
    const conversationMsgs = messages.filter(m => m.role !== 'system');

    const response = await this.ai.models.generateContent({
      model: this.model,
      ...(systemMsg && { systemInstruction: systemMsg.content }),
      contents: conversationMsgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    const content = response.text;
    if (!content) throw new Error('Vertex AI returned empty response');
    return content;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLLMProvider(): LLMProvider {
  const provider = getLLMProviderName();
  const config = getLLMConfigStatus();

  if (!config.isConfigured) {
    throw new Error(
      `LLM configuration error: provider "${config.provider}" is not configured. Missing ${config.missingEnv.join(', ')}.`
    );
  }

  switch (provider) {
    case 'vertex_ai':
    case 'vertexai':
      return new VertexAIProvider(
        requireEnv('GCP_PROJECT_ID'),
        process.env.GCP_LOCATION ?? 'global',
        process.env.LLM_MODEL ?? 'gemini-3.1-flash-lite-preview'
      );
    case 'ollama':
      return new OllamaProvider(
        process.env.LLM_BASE_URL ?? 'http://localhost:11434',
        process.env.LLM_MODEL ?? 'llama3.1'
      );
    case 'openai_compatible':
    case 'openai':
    case 'anthropic':
    case 'nvidia':
    default:
      return new OpenAICompatibleProvider(
        requireEnv('LLM_BASE_URL').replace(/\/$/, ''),
        requireEnv('LLM_API_KEY'),
        requireEnv('LLM_MODEL')
      );
  }
}

export function getLLMConfigStatus(env: NodeJS.ProcessEnv = process.env): LLMConfigStatus {
  const provider = getLLMProviderName(env);

  switch (provider) {
    case 'vertex_ai':
    case 'vertexai': {
      const missingEnv = ['GCP_PROJECT_ID'].filter((name) => !env[name]?.trim());
      return { provider, missingEnv, isConfigured: missingEnv.length === 0 };
    }
    case 'ollama':
      return { provider, missingEnv: [], isConfigured: true };
    case 'openai_compatible':
    case 'openai':
    case 'anthropic':
    case 'nvidia':
    default: {
      const missingEnv = ['LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL'].filter((name) => !env[name]?.trim());
      return { provider, missingEnv, isConfigured: missingEnv.length === 0 };
    }
  }
}

function getLLMProviderName(env: NodeJS.ProcessEnv = process.env): string {
  return (env.LLM_PROVIDER ?? 'openai_compatible').toLowerCase();
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`LLM configuration error: missing ${name}.`);
  }
  return value.trim();
}
