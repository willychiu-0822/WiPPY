import * as admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import { getDb } from '../firebase';
import { FirestoreLearningRepository } from '../learning/adapters/firestore/firestoreLearningRepository';
import { facetStateId, knowledgeItemId, stableId } from '../learning/adapters/firestore/ids';
import type { CreateSourceInput, SaveRoundInput } from '../learning/application/ports';
import type { ChallengeBlueprint, FacetMemory, KnowledgeItem } from '../learning/domain/model';

const EMULATOR = !!process.env['FIRESTORE_EMULATOR_HOST'];
const d = EMULATOR ? describe : describe.skip;

process.env['FIREBASE_PROJECT_ID'] = process.env['FIREBASE_PROJECT_ID'] || 'demo-wippy-learning';

function iso(hours = 0): string {
  return new Date(Date.UTC(2026, 7, 10, hours, 0, 0)).toISOString();
}

function sourceInput(userId: string, requestId: string, text = 'Run it by Maya first.'): CreateSourceInput {
  return {
    userId,
    requestId,
    title: 'Startup notes',
    author: null,
    url: 'https://example.com/startup',
    objective: null,
    createdAt: iso(),
    segments: [{ ordinal: 0, text }],
  };
}

function item(userId: string, id = knowledgeItemId(userId, 'run something by someone', 'seek-feedback')): KnowledgeItem {
  return {
    id,
    expression: 'run something by someone',
    normalizedForm: 'run something by someone',
    senseKey: 'seek-feedback',
    senseStatus: 'resolved',
    qualityStatus: 'verified',
    kind: 'collocation',
    facets: ['meaning'],
    value: { personal: 0.8, transfer: 0.8, comprehension: 0.8, recurrence: 0.8, productiveIntent: 0 },
    evidence: [{ sourceType: 'dictionary', sourceName: 'Cambridge Dictionary', locator: 'https://dictionary.cambridge.org/us/dictionary/english/run-by' }],
    explicitRecognitionGoal: false,
    excludedByUser: false,
    createdAt: iso(),
  };
}

function memory(userId: string, itemId = item(userId).id): FacetMemory {
  return {
    itemId,
    facet: 'meaning',
    target: 'novel_context_recognition',
    halfLifeHours: 24,
    uncertainty: 1,
    lastEvidenceAt: null,
    cooldownUntil: null,
    immediateUnaidedSuccesses: 0,
    delayedUnaidedSuccesses: 0,
  };
}

function blueprint(): ChallengeBlueprint {
  return {
    facet: 'meaning',
    target: 'novel_context_recognition',
    stage: 'immediate_novel',
    taskMode: 'meaning_choice',
    promptZh: '這句最接近哪個意思？',
    options: [{ id: 'a', text: '先詢問 Maya 的意見' }],
    correctOptionId: 'a',
    hints: ['Maya 是接收意見的人。'],
    recommendedSupport: 'none',
    explanationZh: 'run something by someone 表示提出來徵詢意見。',
    decisiveCluesZh: ['run it by + 人。'],
    optionExplanations: [{ optionId: 'a', explanationZh: '這個選項保留徵詢意見。' }],
    ambiguityNoteZh: null,
    evidence: [{ sourceType: 'dictionary', sourceName: 'Cambridge Dictionary', locator: 'https://dictionary.cambridge.org/us/dictionary/english/run-by' }],
    contextNovelty: 0.9,
    contextProvenance: 'synthetic',
    templateId: 'run-by-meaning-1',
    excerptEn: 'Run it by Maya first.',
    contextFingerprint: 'sha256:run-by-maya',
    contextQuality: 1,
  };
}

async function clearLearning(db: Firestore): Promise<void> {
  const collections = await db.listCollections();
  for (const collection of collections.filter((entry) => entry.id.startsWith('learning'))) {
    const snap = await collection.get();
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

d('FirestoreLearningRepository', () => {
  jest.setTimeout(120_000);

  let db: Firestore;
  let repo: FirestoreLearningRepository;

  beforeAll(() => {
    db = getDb();
    repo = new FirestoreLearningRepository(db);
  });

  beforeEach(async () => {
    await clearLearning(db);
  });

  afterAll(async () => {
    await Promise.all(admin.apps.map((app) => app?.delete()));
  });

  it('creates stable IDs that differ across users and senses', () => {
    expect(stableId('a', 'b')).toBe(stableId('a', 'b'));
    expect(knowledgeItemId('user-a', 'run', 'manage-business')).not.toBe(knowledgeItemId('user-b', 'run', 'manage-business'));
    expect(knowledgeItemId('user-a', 'run', 'manage-business')).not.toBe(knowledgeItemId('user-a', 'run', 'seek-feedback'));
    expect(facetStateId('user-a', 'item-1', 'meaning', 'novel_context_recognition')).toBe(facetStateId('user-a', 'item-1', 'meaning', 'novel_context_recognition'));
  });

  it('replays identical source requests and rejects conflicting payloads', async () => {
    const first = await repo.createSourceAndRun(sourceInput('user-a', 'request-1'));
    const replay = await repo.createSourceAndRun(sourceInput('user-a', 'request-1'));

    await expect(repo.createSourceAndRun(sourceInput('user-a', 'request-1', 'Different text.'))).rejects.toThrow('source_request_conflict');
    expect(replay).toEqual(first);
  });

  it('keeps source and run views owner scoped', async () => {
    const created = await repo.createSourceAndRun(sourceInput('user-a', 'request-1'));

    await expect(repo.getSource('user-a', created.sourceId)).resolves.toMatchObject({ id: created.sourceId, verifiedItemCount: 0 });
    await expect(repo.getSource('user-b', created.sourceId)).resolves.toBeNull();
    await expect(repo.getRun('user-a', created.runId)).resolves.toMatchObject({ id: created.runId, sourceId: created.sourceId });
    await expect(repo.getRun('user-b', created.runId)).resolves.toBeNull();
  });

  it('saves capture batches idempotently without overwriting existing memory', async () => {
    const userId = 'user-a';
    const source = await repo.createSourceAndRun(sourceInput(userId, 'request-1'));
    const knowledge = item(userId);
    const facet = memory(userId);
    const learnedFacet = { ...facet, halfLifeHours: 72, uncertainty: 0.5, immediateUnaidedSuccesses: 2 };
    await db.collection('learningFacetStates').doc(facetStateId(userId, facet.itemId, facet.facet, facet.target)).set({
      schemaVersion: 1,
      userId,
      published: true,
      nextCandidateAt: iso(1),
      ...learnedFacet,
    });

    await repo.saveCaptureBatch({
      userId,
      runId: source.runId,
      sourceId: source.sourceId,
      sourceVersionId: source.sourceVersionId,
      batchId: 'batch-1',
      capturedAt: iso(),
      units: [
        {
          item: knowledge,
          occurrence: {
            id: stableId(source.sourceVersionId, '0', '0', '13'),
            segmentId: stableId(source.sourceVersionId, '0', 'Run it by Maya first.'),
            surfaceForm: 'Run it by Maya',
            startOffset: 0,
            endOffset: 14,
            provenance: 'source',
          },
          link: { occurrenceId: stableId(source.sourceVersionId, '0', '0', '13'), itemId: knowledge.id },
        },
      ],
      facetStates: [facet],
    });
    await repo.saveCaptureBatch({
      userId,
      runId: source.runId,
      sourceId: source.sourceId,
      sourceVersionId: source.sourceVersionId,
      batchId: 'batch-1',
      capturedAt: iso(),
      units: [],
      facetStates: [],
    });

    const storedFacet = await db.collection('learningFacetStates').doc(facetStateId(userId, facet.itemId, facet.facet, facet.target)).get();
    expect(storedFacet.data()).toMatchObject({ halfLifeHours: 72, uncertainty: 0.5, immediateUnaidedSuccesses: 2 });
  });

  it('rejects round units or challenges whose session IDs do not match the allocated round', async () => {
    const round: SaveRoundInput = {
      userId: 'user-a',
      roundId: 'round-1',
      createdAt: iso(),
      units: [
        {
          id: 'unit-1',
          sessionId: 'wrong-round',
          itemId: 'item-1',
          role: 'main',
          nextStepPolicy: 'adaptive_minimum',
          status: 'active',
          attemptedFacets: [],
          stepCount: 0,
          maxSteps: 3,
          initialPlan: blueprint(),
        },
      ],
      firstChallenge: null,
    };

    await expect(repo.saveRound(round)).rejects.toThrow('round_session_mismatch');
  });
});
