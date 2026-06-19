import { stripKnowledgeBlock } from './shared';
import type { IntentHandler, IntentPersistResult, ValidationOutcome } from './types';

/**
 * Fallback handler — always matches, never persists. Must be registered last so
 * it only catches replies no other handler claimed.
 */
export const generalChat: IntentHandler<string> = {
  name: 'general_chat',

  detect(rawReply) {
    return rawReply;
  },

  validate(): ValidationOutcome {
    return { valid: true, feedback: '' };
  },

  async persist(): Promise<IntentPersistResult> {
    return { savedCount: 0, ids: [], batchCount: 0 };
  },

  finalize(rawReply) {
    return stripKnowledgeBlock(rawReply);
  },
};
