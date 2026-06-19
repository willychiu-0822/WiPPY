// Mock firebase-admin before importing the module under test.
jest.mock('firebase-admin', () => ({
  firestore: {
    Timestamp: { now: () => ({ seconds: 0, nanoseconds: 0 }) },
  },
}));
jest.mock('firebase-admin/firestore', () => ({}));

import { persistEffects, type BatchCommitInfo, type MessageDraft, type KnowledgeDraft } from '../services/persistenceAdapter';

function makeDb() {
  const counters: Record<string, number> = {};
  const genId = (name: string) => `${name}_${(counters[name] = (counters[name] ?? 0) + 1)}`;
  const commits: Array<Array<{ ref: { id: string }; data: Record<string, unknown> }>> = [];

  const docFactory = (name: string): jest.Mock =>
    jest.fn((id?: string) => ({
      id: id ?? genId(name),
      collection: jest.fn((sub: string) => ({ doc: docFactory(sub) })),
    }));

  const db: any = {
    collection: jest.fn((name: string) => ({ doc: docFactory(name) })),
    batch: jest.fn(() => {
      const staged: Array<{ ref: { id: string }; data: Record<string, unknown> }> = [];
      return {
        set: (ref: { id: string }, data: Record<string, unknown>) => staged.push({ ref, data }),
        commit: () => {
          commits.push(staged);
          return Promise.resolve();
        },
      };
    }),
    commits,
  };
  return db;
}

const msgDraft = (overrides: Partial<MessageDraft> = {}): MessageDraft => ({
  content: 'hello',
  targetGroups: ['all'],
  triggerValue: '2026-05-01T10:00:00+08:00',
  sequenceOrder: 1,
  agentSessionId: 's1',
  runId: 'r1',
  activityId: 'a1',
  userId: 'u1',
  ...overrides,
});

const knowledgeDraft = (overrides: Partial<KnowledgeDraft> = {}): KnowledgeDraft => ({
  knowledgeType: 'background',
  title: 't',
  content: 'c',
  activityId: 'a1',
  userId: 'u1',
  runId: 'r1',
  ...overrides,
});

describe('persistEffects — knowledge ids', () => {
  it('returns an id for each saved knowledge item', async () => {
    const db = makeDb();
    const result = await persistEffects(db, [], [knowledgeDraft(), knowledgeDraft({ knowledgeType: 'faq' })]);
    expect(result.savedKnowledgeCount).toBe(2);
    expect(result.savedKnowledgeIds).toHaveLength(2);
    expect(result.savedKnowledgeIds.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
  });

  it('skips invalid knowledge types and does not count them', async () => {
    const db = makeDb();
    const result = await persistEffects(db, [], [
      knowledgeDraft(),
      knowledgeDraft({ knowledgeType: 'not_a_real_type' }),
    ]);
    expect(result.savedKnowledgeCount).toBe(1);
    expect(result.savedKnowledgeIds).toHaveLength(1);
  });
});

describe('persistEffects — batch commit callback', () => {
  it('reports committed message and knowledge ids per batch', async () => {
    const db = makeDb();
    const batches: BatchCommitInfo[] = [];
    const result = await persistEffects(db, [msgDraft()], [knowledgeDraft()], (info) => batches.push(info));

    expect(result.batchCount).toBe(1);
    expect(batches).toHaveLength(1);
    expect(batches[0].batchIndex).toBe(0);
    expect(batches[0].messageIds).toEqual(result.savedMessages.map((m) => m.id));
    expect(batches[0].knowledgeIds).toEqual(result.savedKnowledgeIds);
  });

  it('splits writes into batches of 499 and reports each batch', async () => {
    const db = makeDb();
    const drafts = Array.from({ length: 500 }, (_, i) => msgDraft({ sequenceOrder: i + 1 }));
    const batches: BatchCommitInfo[] = [];
    const result = await persistEffects(db, drafts, [], (info) => batches.push(info));

    expect(result.batchCount).toBe(2);
    expect(batches.map((b) => b.batchIndex)).toEqual([0, 1]);
    expect(batches[0].messageIds).toHaveLength(499);
    expect(batches[1].messageIds).toHaveLength(1);
  });

  it('commits nothing and fires no callback when there are no drafts', async () => {
    const db = makeDb();
    const cb = jest.fn();
    const result = await persistEffects(db, [], [], cb);
    expect(result.batchCount).toBe(0);
    expect(result.savedMessages).toHaveLength(0);
    expect(result.savedKnowledgeIds).toHaveLength(0);
    expect(cb).not.toHaveBeenCalled();
  });
});
