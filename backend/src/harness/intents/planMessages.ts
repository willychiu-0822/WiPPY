import { validateMessagePlan } from '../../services/planValidator';
import { persistEffects } from '../../services/persistenceAdapter';
import type { GeneratedMessageDraft, IntentHandler, IntentPersistResult, ValidationOutcome } from './types';

function checkMessageItems(parsed: unknown[]): GeneratedMessageDraft[] | null {
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  for (const item of parsed) {
    const i = item as Record<string, unknown>;
    if (typeof i.content !== 'string' || typeof i.triggerValue !== 'string' || typeof i.sequenceOrder !== 'number') return null;
  }
  return parsed as GeneratedMessageDraft[];
}

function tryParseMessagePlan(text: string): GeneratedMessageDraft[] | null {
  try {
    // Strip markdown code fences first
    const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();

    // Try direct array parse on stripped text
    if (stripped.startsWith('[')) {
      try {
        const parsed = JSON.parse(stripped) as unknown[];
        const result = checkMessageItems(parsed);
        if (result) return result;
      } catch { /* fall through */ }
    }

    // Try regex extraction from stripped or original text
    const match = stripped.match(/\[\s*\{[\s\S]*\}\s*\]/) ?? text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as unknown[];
    return checkMessageItems(parsed);
  } catch { return null; }
}

export const planMessages: IntentHandler<GeneratedMessageDraft[]> = {
  name: 'plan_messages',

  detect(rawReply) {
    return tryParseMessagePlan(rawReply);
  },

  validate(parsed): ValidationOutcome {
    return validateMessagePlan(parsed);
  },

  async persist(db, parsed, meta): Promise<IntentPersistResult> {
    const drafts = parsed.map((d) => ({
      ...d,
      targetGroups: d.targetGroups.includes('all') ? meta.activityTargetGroups : d.targetGroups,
      agentSessionId: meta.agentSessionId,
      runId: meta.runId,
      activityId: meta.activityId,
      userId: meta.userId,
    }));
    const { savedMessages, batchCount } = await persistEffects(db, drafts, [], meta.onBatchCommitted);
    return { savedCount: savedMessages.length, ids: savedMessages.map((m) => m.id), batchCount };
  },

  finalize(rawReply, _parsed, result) {
    if (result.savedCount > 0) {
      return `已為你規劃 ${result.savedCount} 則推播訊息，請在「推播企畫」頁籤確認內容。`;
    }
    return rawReply;
  },

  repairHint() {
    return '請只輸出正確的 JSON 陣列，不要有任何其他文字。';
  },
};
