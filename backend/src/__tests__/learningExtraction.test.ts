import { DeterministicExtractor } from '../learning/adapters/extraction/deterministicExtractor';
import { knowledgeItemId } from '../learning/adapters/firestore/ids';

const text = 'Before building it, run the idea by a few users. Later, run the company with care.';

describe('deterministic learning extraction', () => {
  it('captures every English word occurrence with offsets and unresolved word items', async () => {
    const extractor = new DeterministicExtractor();
    const units = await extractor.extract({
      userId: 'user-a',
      sourceId: 'source-1',
      sourceVersionId: 'version-1',
      segmentId: 'segment-1',
      text,
    });

    const wordUnits = units.filter((unit) => unit.item.kind === 'word');
    expect(wordUnits.map((unit) => [unit.occurrence.surfaceForm, unit.occurrence.startOffset, unit.occurrence.endOffset])).toEqual([
      ['Before', 0, 6],
      ['building', 7, 15],
      ['it', 16, 18],
      ['run', 20, 23],
      ['the', 24, 27],
      ['idea', 28, 32],
      ['by', 33, 35],
      ['a', 36, 37],
      ['few', 38, 41],
      ['users', 42, 47],
      ['Later', 49, 54],
      ['run', 56, 59],
      ['the', 60, 63],
      ['company', 64, 71],
      ['with', 72, 76],
      ['care', 77, 81],
    ]);
    expect(wordUnits.every((unit) => unit.item.senseKey === 'unresolved-cluster')).toBe(true);
    expect(wordUnits.every((unit) => unit.item.qualityStatus === 'unresolved')).toBe(true);
  });

  it('emits reviewed run senses separately with overlapping occurrences', async () => {
    const extractor = new DeterministicExtractor();
    const units = await extractor.extract({
      userId: 'user-a',
      sourceId: 'source-1',
      sourceVersionId: 'version-1',
      segmentId: 'segment-1',
      text,
    });

    const seekFeedback = units.find((unit) => unit.item.senseKey === 'seek-feedback');
    const manageBusiness = units.find((unit) => unit.item.senseKey === 'manage-business');
    const runWord = units.find((unit) => unit.item.kind === 'word' && unit.occurrence.surfaceForm === 'run');

    expect(seekFeedback?.item).toMatchObject({
      expression: 'run something by someone',
      normalizedForm: 'run something by someone',
      qualityStatus: 'verified',
      facets: ['meaning', 'chunk', 'syntax', 'pragmatics'],
    });
    expect(manageBusiness?.item).toMatchObject({
      expression: 'run a company',
      normalizedForm: 'run a company',
      qualityStatus: 'verified',
    });
    expect(seekFeedback?.item.id).toBe(knowledgeItemId('user-a', 'run something by someone', 'seek-feedback'));
    expect(manageBusiness?.item.id).toBe(knowledgeItemId('user-a', 'run a company', 'manage-business'));
    expect(runWord?.item.id).not.toBe(seekFeedback?.item.id);
    expect(seekFeedback?.occurrence.startOffset).toBeLessThan(runWord?.occurrence.endOffset ?? 0);
    expect(seekFeedback?.occurrence.endOffset).toBeGreaterThan(runWord?.occurrence.startOffset ?? 0);
  });

  it('allows only reviewed entries to become verified and never emits production evidence', async () => {
    const extractor = new DeterministicExtractor();
    const units = await extractor.extract({
      userId: 'user-a',
      sourceId: 'source-1',
      sourceVersionId: 'version-1',
      segmentId: 'segment-1',
      text,
    });

    const verified = units.filter((unit) => unit.item.qualityStatus === 'verified');
    expect(verified).toHaveLength(2);
    expect(verified.every((unit) => unit.item.evidence.some((evidence) => ['dictionary', 'corpus', 'syntax'].includes(evidence.sourceType)))).toBe(true);
    expect(JSON.stringify(units)).not.toMatch(/free_production|supported_production|independent_production/);
  });
});
