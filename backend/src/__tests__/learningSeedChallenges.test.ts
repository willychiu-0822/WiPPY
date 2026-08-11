import { seedChallengeBuilder } from '../learning/adapters/challenges/seedChallengeBuilder';
import { reviewedSeedCatalog } from '../learning/adapters/extraction/reviewedSeedCatalog';
import type { SourceContextRef } from '../learning/domain/model';

const seekFeedback = reviewedSeedCatalog.getBySense('run something by someone', 'seek-feedback');

function sourceContext(overrides: Partial<SourceContextRef> = {}): SourceContextRef {
  return {
    provenance: 'source',
    sourceId: 'source-1',
    sourceVersionId: 'version-1',
    segmentId: 'segment-1',
    startOffset: 20,
    endOffset: 47,
    contextFingerprint: 'sha256:source-run-by',
    contextQuality: 1,
    contextNovelty: 0.6,
    ...overrides,
  };
}

describe('reviewed seed challenge builder', () => {
  it('has four recognition templates for run something by someone', async () => {
    expect(seekFeedback).toBeTruthy();

    for (const facet of ['meaning', 'chunk', 'syntax', 'pragmatics'] as const) {
      const challenge = await seedChallengeBuilder.build({
        item: seekFeedback!.item,
        facet,
        target: 'novel_context_recognition',
        stage: 'immediate_novel',
        recommendedSupport: 'none',
        excludedContextFingerprints: [],
        sourceContext: null,
      });

      expect(challenge).toMatchObject({
        facet,
        contextProvenance: 'synthetic',
        recommendedSupport: 'none',
      });
      expect(challenge?.options.length).toBeGreaterThanOrEqual(2);
      expect(challenge?.hints).toHaveLength(2);
      expect(challenge?.decisiveCluesZh.length).toBeGreaterThan(0);
      expect(challenge?.optionExplanations).toHaveLength(challenge?.options.length ?? 0);
      expect(challenge?.evidence.some((evidence) => evidence.sourceName && evidence.locator)).toBe(true);
    }
  });

  it('uses cautious interpretive language for pragmatics', async () => {
    const challenge = await seedChallengeBuilder.build({
      item: seekFeedback!.item,
      facet: 'pragmatics',
      target: 'novel_context_recognition',
      stage: 'immediate_novel',
      recommendedSupport: 'none',
      excludedContextFingerprints: [],
      sourceContext: null,
    });

    expect(`${challenge?.explanationZh} ${challenge?.ambiguityNoteZh ?? ''}`).toMatch(/可能|一種讀法/);
    expect(`${challenge?.explanationZh} ${challenge?.ambiguityNoteZh ?? ''}`).not.toMatch(/作者就是|作者一定|真正意圖/);
  });

  it('requires source context for source recognition and preserves the span reference', async () => {
    await expect(
      seedChallengeBuilder.build({
        item: seekFeedback!.item,
        facet: 'meaning',
        target: 'source_recognition',
        stage: 'immediate_source',
        recommendedSupport: 'hint_1',
        excludedContextFingerprints: [],
        sourceContext: null,
      }),
    ).resolves.toBeNull();

    const challenge = await seedChallengeBuilder.build({
      item: seekFeedback!.item,
      facet: 'meaning',
      target: 'source_recognition',
      stage: 'immediate_source',
      recommendedSupport: 'hint_1',
      excludedContextFingerprints: [],
      sourceContext: sourceContext(),
    });

    expect(challenge).toMatchObject({
      contextProvenance: 'source',
      segmentId: 'segment-1',
      startOffset: 20,
      endOffset: 47,
      contextFingerprint: 'sha256:source-run-by',
      recommendedSupport: 'hint_1',
    });
    expect(challenge).not.toHaveProperty('excerptEn');
  });

  it('rejects low-quality or already-used contexts', async () => {
    await expect(
      seedChallengeBuilder.build({
        item: seekFeedback!.item,
        facet: 'meaning',
        target: 'source_recognition',
        stage: 'immediate_source',
        recommendedSupport: 'none',
        excludedContextFingerprints: [],
        sourceContext: sourceContext({ contextQuality: 0.69 }),
      }),
    ).resolves.toBeNull();

    await expect(
      seedChallengeBuilder.build({
        item: seekFeedback!.item,
        facet: 'meaning',
        target: 'novel_context_recognition',
        stage: 'immediate_novel',
        recommendedSupport: 'none',
        excludedContextFingerprints: ['sha256:synthetic-run-by-meaning-1'],
        sourceContext: null,
      }),
    ).resolves.toBeNull();
  });
});
