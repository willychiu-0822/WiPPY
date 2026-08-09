export interface LearningApiError {
  error: string;
  code: string;
}

export function statusForLearningError(error: unknown): { status: number; body: LearningApiError } {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('invalid_answer_option')) {
    return { status: 400, body: { error: 'Invalid answer option', code: 'invalid_answer_option' } };
  }
  if (message.includes('source_request_conflict') || message.includes('attempt_id_conflict')) {
    return { status: 409, body: { error: 'Conflict', code: message } };
  }
  if (message.includes('not_found') || message.includes('challenge_not_found')) {
    return { status: 404, body: { error: 'Not found', code: 'not_found' } };
  }
  if (message.includes('queue_unavailable')) {
    return { status: 503, body: { error: 'Queue unavailable', code: 'queue_unavailable' } };
  }
  return { status: 500, body: { error: 'Internal server error', code: 'internal_error' } };
}
