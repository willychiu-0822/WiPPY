import type { CaptureBatchInput, LanguageExtractor, LearningRepository } from './ports';
import type { FacetMemory } from '../domain/model';

export interface CaptureSourceVersionInput {
  userId: string;
  runId: string;
  sourceId: string;
  sourceVersionId: string;
  capturedAt: string;
}

export interface CaptureSummary {
  segmentCount: number;
  capturedItemCount: number;
  capturedOccurrenceCount: number;
  verifiedItemCount: number;
}

function facetStatesForVerifiedUnits(input: CaptureBatchInput): FacetMemory[] {
  const states = new Map<string, FacetMemory>();
  for (const unit of input.units) {
    if (unit.item.qualityStatus !== 'verified') continue;
    for (const facet of unit.item.facets) {
      for (const target of ['source_recognition', 'novel_context_recognition'] as const) {
        const key = `${unit.item.id}:${facet}:${target}`;
        states.set(key, {
          itemId: unit.item.id,
          facet,
          target,
          halfLifeHours: 24,
          uncertainty: 1,
          lastEvidenceAt: null,
          cooldownUntil: null,
          immediateUnaidedSuccesses: 0,
          delayedUnaidedSuccesses: 0,
        });
      }
    }
  }
  return Array.from(states.values());
}

export async function captureSourceVersion(
  input: CaptureSourceVersionInput,
  deps: { repository: LearningRepository; extractor: LanguageExtractor },
): Promise<CaptureSummary> {
  const segments = await deps.repository.listSourceSegments(input.userId, input.sourceVersionId);
  const units = (
    await Promise.all(
      segments.map((segment) =>
        deps.extractor.extract({
          userId: input.userId,
          sourceId: input.sourceId,
          sourceVersionId: input.sourceVersionId,
          segmentId: segment.id,
          text: segment.text,
        }),
      ),
    )
  ).flat();
  const uniqueItems = new Set(units.map((unit) => unit.item.id));
  const verifiedItems = new Set(units.filter((unit) => unit.item.qualityStatus === 'verified').map((unit) => unit.item.id));

  const batch: CaptureBatchInput = {
    userId: input.userId,
    runId: input.runId,
    sourceId: input.sourceId,
    sourceVersionId: input.sourceVersionId,
    batchId: `${input.runId}:capture:0`,
    capturedAt: input.capturedAt,
    units,
    facetStates: [],
  };
  batch.facetStates = facetStatesForVerifiedUnits(batch);

  await deps.repository.saveCaptureBatch(batch);

  return {
    segmentCount: segments.length,
    capturedItemCount: uniqueItems.size,
    capturedOccurrenceCount: units.length,
    verifiedItemCount: verifiedItems.size,
  };
}
