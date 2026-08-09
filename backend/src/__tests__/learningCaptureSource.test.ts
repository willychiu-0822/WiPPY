import { captureSourceVersion } from '../learning/application/captureSourceVersion';
import { segmentSourceText } from '../learning/application/segmentSourceText';
import { DeterministicExtractor } from '../learning/adapters/extraction/deterministicExtractor';
import type { CaptureBatchInput, LearningRepository, SourceSegmentView } from '../learning/application/ports';

class FakeRepository implements Partial<LearningRepository> {
  batches: CaptureBatchInput[] = [];
  segments: SourceSegmentView[];

  constructor(segments: SourceSegmentView[]) {
    this.segments = segments;
  }

  async listSourceSegments(): Promise<SourceSegmentView[]> {
    return this.segments;
  }

  async saveCaptureBatch(input: CaptureBatchInput): Promise<void> {
    this.batches.push(input);
  }
}

describe('learning source capture', () => {
  it('segments non-empty paragraphs without client-controlled ids', () => {
    expect(segmentSourceText(' First paragraph.\n\n\nSecond paragraph. \n  \nThird. ')).toEqual([
      { ordinal: 0, text: 'First paragraph.' },
      { ordinal: 1, text: 'Second paragraph.' },
      { ordinal: 2, text: 'Third.' },
    ]);
  });

  it('rejects oversize source bodies and paragraph counts before persistence', () => {
    expect(() => segmentSourceText('a'.repeat(50_001))).toThrow('source_body_too_large');
    expect(() => segmentSourceText(Array.from({ length: 401 }, (_, index) => `p${index}`).join('\n\n'))).toThrow('too_many_paragraphs');
  });

  it('turns persisted segments into occurrences, links, and scheduling-only facet states', async () => {
    const repository = new FakeRepository([
      { id: 'segment-1', ordinal: 0, text: 'Before building it, run the idea by a few users.' },
      { id: 'segment-2', ordinal: 1, text: 'Later, run the company with care.' },
    ]);

    const summary = await captureSourceVersion(
      {
        userId: 'user-a',
        runId: 'run-1',
        sourceId: 'source-1',
        sourceVersionId: 'version-1',
        capturedAt: '2026-08-10T00:00:00.000Z',
      },
      { repository: repository as unknown as LearningRepository, extractor: new DeterministicExtractor() },
    );

    const allUnits = repository.batches.flatMap((batch) => batch.units);
    const allStates = repository.batches.flatMap((batch) => batch.facetStates);
    expect(summary).toMatchObject({ segmentCount: 2, verifiedItemCount: 2 });
    expect(allUnits.some((unit) => unit.item.senseKey === 'seek-feedback')).toBe(true);
    expect(allUnits.some((unit) => unit.item.senseKey === 'manage-business')).toBe(true);
    expect(allStates.every((state) => state.lastEvidenceAt === null && state.immediateUnaidedSuccesses === 0 && state.delayedUnaidedSuccesses === 0)).toBe(true);
    expect(JSON.stringify(repository.batches)).not.toMatch(/learningAttempts|session|delayed_novel/);
  });
});
