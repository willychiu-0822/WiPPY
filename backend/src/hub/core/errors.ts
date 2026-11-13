import { PermanentError, RetryableError } from './jobs';
import { UpstreamError } from './ports';

/** Maps an outbound-call error to retry semantics: 429/5xx/network retry, other 4xx do not. */
export function toJobError(err: unknown, context: string): RetryableError | PermanentError {
  if (err instanceof RetryableError || err instanceof PermanentError) return err;
  const message = err instanceof Error ? err.message : String(err);
  if (err instanceof UpstreamError && err.status !== null && err.status >= 400 && err.status < 500 && err.status !== 429 && err.status !== 408) {
    return new PermanentError(`${context}: ${message} (HTTP ${err.status})`);
  }
  return new RetryableError(`${context}: ${message}`);
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
