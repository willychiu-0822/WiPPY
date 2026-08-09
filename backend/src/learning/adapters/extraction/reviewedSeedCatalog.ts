import type { Facet, KnowledgeItem, LanguageEvidence, ValueSignals } from '../../domain/model';

export interface ReviewedSeed {
  item: KnowledgeItem;
  pattern: RegExp;
  facets: Facet[];
}

const now = '2026-08-10T00:00:00.000Z';
const strongValue: ValueSignals = {
  personal: 0.8,
  transfer: 0.9,
  comprehension: 0.9,
  recurrence: 0.8,
  productiveIntent: 0,
};

function evidence(sourceName: string, locator: string): LanguageEvidence[] {
  return [{ sourceType: 'dictionary', sourceName, locator }];
}

function seed(
  expression: string,
  normalizedForm: string,
  senseKey: string,
  pattern: RegExp,
  sourceName: string,
  locator: string,
): Omit<ReviewedSeed, 'item'> & { item: Omit<KnowledgeItem, 'id'> } {
  const itemEvidence = evidence(sourceName, locator);
  if (itemEvidence.length === 0) {
    throw new Error('invalid_seed_catalog');
  }
  return {
    pattern,
    facets: ['meaning', 'chunk', 'syntax', 'pragmatics'],
    item: {
      expression,
      normalizedForm,
      senseKey,
      senseStatus: 'resolved',
      qualityStatus: 'verified',
      kind: 'collocation',
      facets: ['meaning', 'chunk', 'syntax', 'pragmatics'],
      value: strongValue,
      evidence: itemEvidence,
      explicitRecognitionGoal: false,
      excludedByUser: false,
      createdAt: now,
    },
  };
}

const seedsWithoutIds = [
  seed(
    'run something by someone',
    'run something by someone',
    'seek-feedback',
    /\brun\s+the\s+idea\s+by\s+a\s+few\s+users\b/gi,
    'Cambridge Dictionary',
    'https://dictionary.cambridge.org/us/dictionary/english/run-by',
  ),
  seed(
    'run a company',
    'run a company',
    'manage-business',
    /\brun\s+the\s+company\b/gi,
    'Merriam-Webster Dictionary',
    'https://www.merriam-webster.com/dictionary/run#dictionary-entry-2',
  ),
];

export const reviewedSeedCatalog = {
  all(): Array<Omit<ReviewedSeed, 'item'> & { item: Omit<KnowledgeItem, 'id'> }> {
    return seedsWithoutIds;
  },
  getBySense(normalizedForm: string, senseKey: string): ReviewedSeed | null {
    const found = seedsWithoutIds.find((seedItem) => seedItem.item.normalizedForm === normalizedForm && seedItem.item.senseKey === senseKey);
    if (!found) return null;
    return {
      ...found,
      item: {
        ...found.item,
        id: `catalog:${normalizedForm}:${senseKey}`,
      },
    };
  },
};
