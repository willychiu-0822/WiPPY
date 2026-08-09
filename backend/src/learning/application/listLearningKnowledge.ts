import type { LearningRepository } from './ports';
import type { Facet } from '../domain/model';
import { summarizeEvidence, type EvidenceSummary } from '../domain/evidence/summarizeEvidence';

export interface KnowledgeItemView {
  id: string;
  expression: string;
  senseKey: string;
  senseStatus: string;
  qualityStatus: string;
  facets: Array<{ facet: Facet; label: string; evidence: EvidenceSummary | null }>;
}

export interface KnowledgePage {
  items: KnowledgeItemView[];
  nextCursor: string | null;
}

export async function listLearningKnowledge(
  input: { userId: string; limit: number; cursor: string | null },
  deps: { repository: LearningRepository },
): Promise<KnowledgePage> {
  const limit = Math.min(50, Math.max(1, input.limit));
  const records = await deps.repository.listKnowledgeRecords(input.userId, { limit, cursor: input.cursor });
  const items = await Promise.all(
    records.items.map(async (item) => {
      const facets = await Promise.all(
        item.facets.map(async (facet) => {
          const context = await deps.repository.listAttemptEvidenceContext(input.userId, item.id, facet);
          const validAttempts = context.attempts.filter((attempt) => !context.invalidatedAttemptIds.includes(attempt.id));
          if (validAttempts.length === 0) {
            return { facet, label: '尚無證據', evidence: null };
          }
          const evidence = summarizeEvidence(validAttempts);
          return { facet, label: evidence.headline, evidence };
        }),
      );
      return {
        id: item.id,
        expression: item.expression,
        senseKey: item.senseKey,
        senseStatus: item.senseStatus,
        qualityStatus: item.qualityStatus,
        facets,
      };
    }),
  );
  return { items, nextCursor: records.nextCursor };
}
