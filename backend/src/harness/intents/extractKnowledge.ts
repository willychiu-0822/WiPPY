import { validateExtractedKnowledge } from '../../services/planValidator';
import { persistEffects } from '../../services/persistenceAdapter';
import { KNOWLEDGE_MARKER, stripKnowledgeBlock } from './shared';
import type { IntentHandler, IntentPersistResult, ParsedKnowledgeItem, ValidationOutcome } from './types';

function tryParseKnowledge(text: string): ParsedKnowledgeItem[] | null {
  try {
    const idx = text.indexOf(KNOWLEDGE_MARKER);
    if (idx === -1) return null;
    const after = text.slice(idx + KNOWLEDGE_MARKER.length).trim();
    const match = after.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? (parsed as ParsedKnowledgeItem[]) : null;
  } catch { return null; }
}

export const extractKnowledge: IntentHandler<ParsedKnowledgeItem[]> = {
  name: 'extract_knowledge',

  detect(rawReply) {
    return tryParseKnowledge(rawReply);
  },

  // Wires validateExtractedKnowledge into the pipeline — empty title/content is
  // now rejected and routed through the repair loop (previously unchecked).
  validate(parsed): ValidationOutcome {
    return validateExtractedKnowledge(parsed);
  },

  async persist(db, parsed, meta): Promise<IntentPersistResult> {
    const drafts = parsed.map((k) => ({
      ...k,
      activityId: meta.activityId,
      userId: meta.userId,
      runId: meta.runId,
    }));
    const { savedKnowledgeCount, savedKnowledgeIds, batchCount } = await persistEffects(db, [], drafts, meta.onBatchCommitted);
    return { savedCount: savedKnowledgeCount, ids: savedKnowledgeIds ?? [], batchCount };
  },

  finalize(rawReply) {
    return stripKnowledgeBlock(rawReply);
  },

  repairHint() {
    return '請在回覆最後附上正確的 EXTRACTED_KNOWLEDGE JSON 區塊，每筆需有 knowledgeType、title、content。';
  },
};
