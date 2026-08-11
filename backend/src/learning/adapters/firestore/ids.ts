import { createHash } from 'crypto';
import type { Facet, MemoryTarget } from '../../domain/model';

export function stableId(...parts: string[]): string {
  return createHash('sha256').update(parts.join('\u001f')).digest('hex').slice(0, 40);
}

export function knowledgeItemId(userId: string, normalizedForm: string, senseKey: string): string {
  return stableId('learningItem', userId, normalizedForm, senseKey);
}

export function occurrenceId(sourceVersionId: string, segmentId: string, startOffset: number, endOffset: number, itemId: string): string {
  return stableId('learningOccurrence', sourceVersionId, segmentId, String(startOffset), String(endOffset), itemId);
}

export function facetStateId(userId: string, itemId: string, facet: Facet, target: MemoryTarget): string {
  return stableId('learningFacetState', userId, itemId, facet, target);
}

export function sourceId(userId: string, requestId: string): string {
  return stableId('learningSource', userId, requestId);
}

export function sourceVersionId(source: string, requestId: string): string {
  return stableId('learningSourceVersion', source, requestId);
}

export function runId(sourceVersion: string): string {
  return stableId('learningRun', sourceVersion);
}

export function segmentId(sourceVersion: string, ordinal: number, text: string): string {
  return stableId('learningSegment', sourceVersion, String(ordinal), text);
}
