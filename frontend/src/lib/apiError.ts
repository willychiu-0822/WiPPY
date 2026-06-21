type ApiErrorBody = {
  error?: unknown;
  message?: unknown;
  detail?: unknown;
  details?: unknown;
};

function asMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (value instanceof Error && value.message.trim()) {
    return value.message.trim();
  }
  return null;
}

export function getErrorMessage(error: unknown, fallback = 'Operation failed'): string {
  const message = asMessage(error);
  if (message) return message.replace(/^Error:\s*/, '');

  if (error && typeof error === 'object') {
    const objectMessage = asMessage((error as { message?: unknown }).message);
    if (objectMessage) return objectMessage.replace(/^Error:\s*/, '');
  }

  if (error === null || error === undefined) return fallback;
  return String(error).replace(/^Error:\s*/, '') || fallback;
}

export async function getResponseErrorMessage(response: Response): Promise<string> {
  const rawText = await response.text().catch(() => '');

  if (rawText) {
    try {
      const body = JSON.parse(rawText) as ApiErrorBody;
      const primary = asMessage(body.error) ?? asMessage(body.message);
      const detail = asMessage(body.detail) ?? asMessage(body.details);

      if (primary && detail && primary !== detail) {
        return `${primary}: ${detail}`;
      }
      if (primary) return primary;
      if (detail) return detail;
    } catch {
      return rawText;
    }
  }

  return `HTTP ${response.status}`;
}
