import type { ExtractedUnit, LanguageExtractor } from '../../application/ports';
import type { KnowledgeItem } from '../../domain/model';
import { knowledgeItemId, occurrenceId } from '../firestore/ids';
import { reviewedSeedCatalog } from './reviewedSeedCatalog';

function unresolvedWordItem(userId: string, word: string): KnowledgeItem {
  const normalized = word.toLowerCase();
  return {
    id: knowledgeItemId(userId, normalized, 'unresolved-cluster'),
    expression: normalized,
    normalizedForm: normalized,
    senseKey: 'unresolved-cluster',
    senseStatus: 'unresolved',
    qualityStatus: 'unresolved',
    kind: 'word',
    facets: ['meaning'],
    value: { personal: 0.1, transfer: 0.1, comprehension: 0.1, recurrence: 0.1, productiveIntent: 0 },
    evidence: [],
    explicitRecognitionGoal: false,
    excludedByUser: false,
    createdAt: '2026-08-10T00:00:00.000Z',
  };
}

export class DeterministicExtractor implements LanguageExtractor {
  async extract(input: { userId: string; sourceId: string; sourceVersionId: string; segmentId: string; text: string }): Promise<ExtractedUnit[]> {
    const units: ExtractedUnit[] = [];
    const wordRegex = /\b[A-Za-z][A-Za-z'-]*\b/g;
    let wordMatch: RegExpExecArray | null;
    while ((wordMatch = wordRegex.exec(input.text)) !== null) {
      const surfaceForm = wordMatch[0];
      const startOffset = wordMatch.index;
      const endOffset = startOffset + surfaceForm.length;
      const item = unresolvedWordItem(input.userId, surfaceForm);
      const id = occurrenceId(input.sourceVersionId, input.segmentId, startOffset, endOffset, item.id);
      units.push({
        item,
        occurrence: { id, segmentId: input.segmentId, surfaceForm, startOffset, endOffset, provenance: 'source' },
        link: { occurrenceId: id, itemId: item.id },
      });
    }

    for (const seed of reviewedSeedCatalog.all()) {
      const pattern = new RegExp(seed.pattern.source, seed.pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(input.text)) !== null) {
        const startOffset = match.index;
        const endOffset = startOffset + match[0].length;
        const item: KnowledgeItem = {
          ...seed.item,
          id: knowledgeItemId(input.userId, seed.item.normalizedForm, seed.item.senseKey),
        };
        const id = occurrenceId(input.sourceVersionId, input.segmentId, startOffset, endOffset, item.id);
        units.push({
          item,
          occurrence: { id, segmentId: input.segmentId, surfaceForm: match[0], startOffset, endOffset, provenance: 'source' },
          link: { occurrenceId: id, itemId: item.id },
        });
      }
    }

    return units;
  }
}
