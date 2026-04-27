import { Timestamp } from 'firebase-admin/firestore';

// ── Firestore mock ─────────────────────────────────────────────────────────────
// We mock the entire firebase-admin module so no real Firestore connection is needed.

const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockAdd = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockBatchUpdate = jest.fn();
const mockBatchCommit = jest.fn();

const mockBatch = jest.fn(() => ({
  update: mockBatchUpdate,
  commit: mockBatchCommit,
}));

function makeDocRef(data: Record<string, unknown> | null, exists = true) {
  const ref: Record<string, unknown> = {
    id: 'mock_doc_id',
    get: jest.fn().mockResolvedValue({ exists, data: () => data }),
    set: mockSet,
    update: mockUpdate,
    delete: mockDelete,
    collection: jest.fn().mockReturnThis(),
  };
  return ref;
}

function makeQuerySnap(docs: Record<string, unknown>[]) {
  return {
    docs: docs.map((d) => ({ id: 'mock_id', data: () => d, ref: makeDocRef(d) })),
  };
}

const mockDocFn = jest.fn();
const mockCollectionFn = jest.fn();

jest.mock('firebase-admin', () => ({
  firestore: {
    Timestamp: {
      now: () => ({ seconds: 0, nanoseconds: 0 }),
    },
  },
}));

jest.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: () => ({ seconds: 0, nanoseconds: 0 }),
  },
}));

// Build a chainable mock db
function buildMockDb(docData: Record<string, unknown> | null = null, queryDocs: Record<string, unknown>[] = []) {
  const docRef = makeDocRef(docData, docData !== null);
  docRef.collection = jest.fn(() => ({
    doc: jest.fn(() => docRef),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(makeQuerySnap(queryDocs)),
    add: mockAdd,
  }));

  const chainable = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(makeQuerySnap(queryDocs)),
  };

  return {
    collection: jest.fn((name: string) => {
      if (name === 'activities') {
        return {
          doc: jest.fn(() => docRef),
          where: chainable.where,
          orderBy: chainable.orderBy,
          get: chainable.get,
        };
      }
      if (name === 'activityKnowledge') {
        return {
          doc: jest.fn(() => docRef),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue(makeQuerySnap(queryDocs)),
        };
      }
      return { doc: jest.fn(() => docRef) };
    }),
    batch: mockBatch,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

import {
  createActivity,
  getActivity,
  listActivities,
  approveActivity,
  requestRevision,
  createMessage,
  createKnowledge,
} from '../services/activityService';

const USER_ID = 'user_1';
const ACT_ID = 'act_1';

const baseActivity = {
  id: ACT_ID,
  userId: USER_ID,
  name: '密室逃脫暖場',
  targetGroups: ['group_a'],
  status: 'draft',
  reviewStatus: 'pending_review',
  approvedAt: null,
  agentSessionId: null,
  eventStartAt: null,
  eventEndAt: null,
  createdAt: { seconds: 0, nanoseconds: 0 },
  updatedAt: { seconds: 0, nanoseconds: 0 },
};

describe('createActivity', () => {
  it('creates activity with draft + pending_review defaults', async () => {
    const db = buildMockDb(null, []) as unknown as ReturnType<typeof buildMockDb> & any;
    // The doc ref returned from collection().doc() needs set to resolve
    const docRef = db.collection('activities').doc();
    (docRef.set as jest.Mock).mockResolvedValue(undefined);

    const result = await createActivity(db as any, USER_ID, {
      name: '密室逃脫暖場',
      targetGroups: ['group_a'],
    });

    expect(result.status).toBe('draft');
    expect(result.reviewStatus).toBe('pending_review');
    expect(result.userId).toBe(USER_ID);
    expect(result.approvedAt).toBeNull();
    expect(result.agentSessionId).toBeNull();
  });
});

describe('getActivity', () => {
  it('returns activity when userId matches', async () => {
    const db = buildMockDb(baseActivity) as any;
    const result = await getActivity(db, ACT_ID, USER_ID);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(ACT_ID);
  });

  it('returns null when userId does not match', async () => {
    const db = buildMockDb(baseActivity) as any;
    const result = await getActivity(db, ACT_ID, 'other_user');
    expect(result).toBeNull();
  });

  it('returns null when document does not exist', async () => {
    const db = buildMockDb(null) as any;
    const result = await getActivity(db, ACT_ID, USER_ID);
    expect(result).toBeNull();
  });
});

describe('listActivities', () => {
  it('returns array of activities for userId', async () => {
    const db = buildMockDb(null, [baseActivity, { ...baseActivity, id: 'act_2' }]) as any;
    const result = await listActivities(db, USER_ID);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no activities exist', async () => {
    const db = buildMockDb(null, []) as any;
    const result = await listActivities(db, USER_ID);
    expect(result).toHaveLength(0);
  });
});

describe('approveActivity', () => {
  it('returns null if activity does not belong to user', async () => {
    const db = buildMockDb(baseActivity) as any;
    const result = await approveActivity(db, ACT_ID, 'other_user');
    expect(result).toBeNull();
  });

  it('calls batch with approve fields when activity is found', async () => {
    mockBatchUpdate.mockClear();
    mockBatchCommit.mockResolvedValue(undefined);

    // After commit, re-read returns approved activity
    const approvedActivity = {
      ...baseActivity,
      status: 'active',
      reviewStatus: 'approved',
      approvedAt: { seconds: 1, nanoseconds: 0 },
    };

    const docRef = {
      id: ACT_ID,
      get: jest.fn()
        .mockResolvedValueOnce({ exists: true, data: () => baseActivity })  // ownership check
        .mockResolvedValueOnce({ exists: true, data: () => approvedActivity }), // re-read after commit
      update: mockUpdate,
      collection: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }), // no pending messages
      })),
    };

    const db = {
      collection: jest.fn(() => ({ doc: jest.fn(() => docRef) })),
      batch: jest.fn(() => ({ update: mockBatchUpdate, commit: mockBatchCommit })),
    } as any;

    const result = await approveActivity(db, ACT_ID, USER_ID);
    expect(result?.reviewStatus).toBe('approved');
    expect(result?.status).toBe('active');
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ reviewStatus: 'approved', status: 'active' })
    );
  });
});

describe('requestRevision', () => {
  it('returns null if activity does not belong to user', async () => {
    const db = buildMockDb(baseActivity) as any;
    const result = await requestRevision(db, ACT_ID, 'other_user');
    expect(result).toBeNull();
  });

  it('sets reviewStatus to revision_requested and locks pending messages', async () => {
    mockBatchUpdate.mockClear();
    mockBatchCommit.mockResolvedValue(undefined);

    const pendingMsg = { id: 'msg_1', status: 'pending', reviewStatus: 'approved' };

    const revisedActivity = { ...baseActivity, reviewStatus: 'revision_requested' };
    const docRef = {
      id: ACT_ID,
      get: jest.fn()
        .mockResolvedValueOnce({ exists: true, data: () => baseActivity })
        .mockResolvedValueOnce({ exists: true, data: () => revisedActivity }),
      collection: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [{ ref: { id: 'msg_1' }, data: () => pendingMsg }],
        }),
      })),
    };

    const db = {
      collection: jest.fn(() => ({ doc: jest.fn(() => docRef) })),
      batch: jest.fn(() => ({ update: mockBatchUpdate, commit: mockBatchCommit })),
    } as any;

    const result = await requestRevision(db, ACT_ID, USER_ID);
    expect(result?.reviewStatus).toBe('revision_requested');
    // Activity batch update
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ reviewStatus: 'revision_requested' })
    );
    // Pending message should be locked back to pending_review
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'msg_1' }),
      expect.objectContaining({ reviewStatus: 'pending_review' })
    );
  });
});

describe('createMessage', () => {
  it('returns null when activity does not belong to user', async () => {
    const db = buildMockDb(baseActivity) as any;
    const result = await createMessage(db, ACT_ID, 'other_user', {
      content: '活動即將開始！',
      targetGroups: ['group_a'],
      triggerType: 'scheduled',
      triggerValue: '2025-05-10T10:00:00+08:00',
      sequenceOrder: 1,
    });
    expect(result).toBeNull();
  });

  it('creates message with pending + pending_review defaults', async () => {
    const docRef = {
      id: 'msg_new',
      get: jest.fn().mockResolvedValueOnce({ exists: true, data: () => baseActivity }),
      set: jest.fn().mockResolvedValue(undefined),
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
    };

    // First collection('activities').doc() → for ownership check via getActivity
    // Then collection('activityMessages').doc() → for the new message ref
    const db = {
      collection: jest.fn((name: string) => {
        if (name === 'activities') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ exists: true, data: () => baseActivity }),
              collection: jest.fn(() => ({ doc: jest.fn(() => docRef) })),
            })),
          };
        }
        return { doc: jest.fn(() => docRef) };
      }),
    } as any;

    const result = await createMessage(db, ACT_ID, USER_ID, {
      content: '活動即將開始！',
      targetGroups: ['group_a'],
      triggerType: 'scheduled',
      triggerValue: '2025-05-10T10:00:00+08:00',
      sequenceOrder: 1,
    });

    expect(result?.status).toBe('pending');
    expect(result?.reviewStatus).toBe('pending_review');
    expect(result?.generatedByAgent).toBe(false);
    expect(result?.processingAt).toBeNull();
  });
});

describe('createKnowledge', () => {
  it('returns null when activity does not belong to user', async () => {
    const db = buildMockDb(baseActivity) as any;
    const result = await createKnowledge(db, ACT_ID, 'other_user', {
      knowledgeType: 'background',
      title: '故事背景',
      content: '這是一場密室逃脫活動。',
    });
    expect(result).toBeNull();
  });

  it('creates knowledge with manual sourceType by default', async () => {
    const knowledgeRef = {
      id: 'know_new',
      set: jest.fn().mockResolvedValue(undefined),
    };

    const db = {
      collection: jest.fn((name: string) => {
        if (name === 'activities') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ exists: true, data: () => baseActivity }),
            })),
          };
        }
        // activityKnowledge
        return { doc: jest.fn(() => knowledgeRef) };
      }),
    } as any;

    const result = await createKnowledge(db, ACT_ID, USER_ID, {
      knowledgeType: 'character',
      title: '主角 — 艾瑞克',
      content: '艾瑞克是一位偵探。',
    });

    expect(result?.sourceType).toBe('manual');
    expect(result?.knowledgeType).toBe('character');
    expect(result?.targetGroupId).toBeNull();
  });
});
