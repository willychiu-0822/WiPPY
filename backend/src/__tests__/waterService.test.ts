import { Timestamp } from 'firebase-admin/firestore';
import {
  TAUNT_MESSAGES,
  ensureIdentity,
  getMemberProfile,
  getRandomTaunt,
  getTodayLeaderboard,
  logDrink,
  resetDayIfNeeded,
} from '../services/waterService';

type WhereOp = '==' | '>=' | '<=';
type OrderDirection = 'asc' | 'desc';

type StoredDoc = Record<string, unknown>;

function cloneDoc<T extends StoredDoc>(value: T): T {
  return { ...value } as T;
}

class FakeDocumentSnapshot {
  constructor(
    public readonly ref: FakeDocumentReference,
    private readonly stored: StoredDoc | undefined
  ) {}

  get exists() {
    return this.stored !== undefined;
  }

  data() {
    return this.stored ? cloneDoc(this.stored) : undefined;
  }
}

class FakeQueryDocumentSnapshot extends FakeDocumentSnapshot {
  constructor(ref: FakeDocumentReference, stored: StoredDoc) {
    super(ref, stored);
  }

  get id() {
    return this.ref.id;
  }
}

class FakeCollectionReference {
  public readonly id: string;

  constructor(
    private readonly db: FakeFirestore,
    public readonly path: string,
    public readonly parent: FakeDocumentReference | null
  ) {
    const segments = path.split('/');
    this.id = segments[segments.length - 1]!;
  }

  doc(id?: string) {
    return new FakeDocumentReference(this.db, `${this.path}/${id ?? this.db.nextId()}`, this);
  }

  where(fieldPath: string, opStr: WhereOp, value: unknown) {
    return new FakeQuery(this.db, this.path, false).where(fieldPath, opStr, value);
  }

  orderBy(fieldPath: string, directionStr: OrderDirection = 'asc') {
    return new FakeQuery(this.db, this.path, false).orderBy(fieldPath, directionStr);
  }

  async get() {
    return new FakeQuery(this.db, this.path, false).get();
  }
}

class FakeDocumentReference {
  public readonly id: string;

  constructor(
    private readonly db: FakeFirestore,
    public readonly path: string,
    public readonly parent: FakeCollectionReference
  ) {
    const segments = path.split('/');
    this.id = segments[segments.length - 1]!;
  }

  async get() {
    return new FakeDocumentSnapshot(this, this.db.read(this.path));
  }

  async set(data: StoredDoc, options?: { merge?: boolean }) {
    this.db.write(this.path, data, options?.merge ?? false);
  }

  async update(data: StoredDoc) {
    this.db.write(this.path, data, true);
  }

  collection(name: string) {
    return new FakeCollectionReference(this.db, `${this.path}/${name}`, this);
  }
}

class FakeQuery {
  private readonly filters: Array<{ fieldPath: string; opStr: WhereOp; value: unknown }>;
  private readonly orders: Array<{ fieldPath: string; directionStr: OrderDirection }>;

  constructor(
    private readonly db: FakeFirestore,
    private readonly path: string,
    private readonly isCollectionGroup: boolean,
    filters: Array<{ fieldPath: string; opStr: WhereOp; value: unknown }> = [],
    orders: Array<{ fieldPath: string; directionStr: OrderDirection }> = []
  ) {
    this.filters = filters;
    this.orders = orders;
  }

  where(fieldPath: string, opStr: WhereOp, value: unknown) {
    return new FakeQuery(this.db, this.path, this.isCollectionGroup, [...this.filters, { fieldPath, opStr, value }], this.orders);
  }

  orderBy(fieldPath: string, directionStr: OrderDirection = 'asc') {
    return new FakeQuery(this.db, this.path, this.isCollectionGroup, this.filters, [...this.orders, { fieldPath, directionStr }]);
  }

  async get() {
    const docs = this.db.query(this.path, this.isCollectionGroup)
      .filter((entry) =>
        this.filters.every((filter) => {
          const value = entry.data[filter.fieldPath] as string | number | Timestamp | null | undefined;
          const expected = filter.value as string | number | Timestamp | null | undefined;
          if (filter.opStr === '==') return value === expected;
          if (filter.opStr === '>=') return (value as string | number) >= (expected as string | number);
          return (value as string | number) <= (expected as string | number);
        })
      )
      .sort((left, right) => {
        for (const order of this.orders) {
          const leftValue = left.data[order.fieldPath] as string | number | Timestamp | null | undefined;
          const rightValue = right.data[order.fieldPath] as string | number | Timestamp | null | undefined;
          if (leftValue === rightValue) {
            continue;
          }

          const compare = leftValue! > rightValue! ? 1 : -1;
          return order.directionStr === 'asc' ? compare : -compare;
        }
        return left.path.localeCompare(right.path);
      })
      .map((entry) => new FakeQueryDocumentSnapshot(entry.ref, entry.data));

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
    };
  }
}

class FakeTransaction {
  private readonly writes: Array<() => void> = [];

  constructor(private readonly db: FakeFirestore) {}

  async get(target: { get: () => Promise<unknown> }) {
    return target.get();
  }

  set(ref: FakeDocumentReference, data: StoredDoc, options?: { merge?: boolean }) {
    this.writes.push(() => this.db.write(ref.path, data, options?.merge ?? false));
  }

  commit() {
    for (const write of this.writes) {
      write();
    }
  }
}

class FakeBatch {
  private readonly writes: Array<() => void> = [];

  constructor(private readonly db: FakeFirestore) {}

  set(ref: FakeDocumentReference, data: StoredDoc, options?: { merge?: boolean }) {
    this.writes.push(() => this.db.write(ref.path, data, options?.merge ?? false));
  }

  async commit() {
    for (const write of this.writes) {
      write();
    }
  }
}

class FakeFirestore {
  private readonly docs = new Map<string, StoredDoc>();
  private counter = 0;

  nextId() {
    this.counter += 1;
    return `doc_${this.counter}`;
  }

  collection(path: string) {
    return new FakeCollectionReference(this, path, null);
  }

  collectionGroup(collectionId: string) {
    return new FakeQuery(this, collectionId, true);
  }

  batch() {
    return new FakeBatch(this);
  }

  async runTransaction<T>(handler: (transaction: FakeTransaction) => Promise<T>) {
    const transaction = new FakeTransaction(this);
    const result = await handler(transaction);
    transaction.commit();
    return result;
  }

  seed(path: string, data: StoredDoc) {
    this.docs.set(path, cloneDoc(data));
  }

  read(path: string) {
    const stored = this.docs.get(path);
    return stored ? cloneDoc(stored) : undefined;
  }

  write(path: string, data: StoredDoc, merge: boolean) {
    const existing = this.docs.get(path);
    const nextValue = merge && existing ? { ...existing, ...cloneDoc(data) } : cloneDoc(data);
    this.docs.set(path, nextValue);
  }

  query(path: string, isCollectionGroup: boolean) {
    const entries: Array<{ path: string; ref: FakeDocumentReference; data: StoredDoc }> = [];

    for (const [docPath, data] of this.docs.entries()) {
      const collectionPath = parentPath(docPath);
      const collectionId = collectionPath.split('/').pop();

      if (isCollectionGroup) {
        if (collectionId !== path) {
          continue;
        }
      } else if (collectionPath !== path) {
        continue;
      }

      const ref = new FakeDocumentReference(this, docPath, new FakeCollectionReference(this, collectionPath, buildParentDocRef(this, collectionPath)));
      entries.push({ path: docPath, ref, data: cloneDoc(data) });
    }

    return entries;
  }
}

function parentPath(path: string) {
  const segments = path.split('/');
  return segments.slice(0, -1).join('/');
}

function buildParentDocRef(db: FakeFirestore, collectionPath: string): FakeDocumentReference | null {
  const segments = collectionPath.split('/');
  if (segments.length < 2) {
    return null;
  }

  const docPath = segments.slice(0, -1).join('/');
  const parentCollectionPath = segments.slice(0, -2).join('/');
  const parentCollection = new FakeCollectionReference(
    db,
    parentCollectionPath || segments[0]!,
    parentCollectionPath ? buildParentDocRef(db, parentCollectionPath) : null
  );

  return new FakeDocumentReference(db, docPath, parentCollection);
}

function ts(isoString: string) {
  return Timestamp.fromDate(new Date(isoString));
}

function seedGroup(db: FakeFirestore, groupId: string, groupName = '讀書會', memberCount = 0) {
  const now = ts('2026-06-20T01:00:00.000Z');
  db.seed(`waterGroups/${groupId}`, {
    groupName,
    memberCount,
    activeSince: now,
    createdAt: now,
    updatedAt: now,
  });
}

function seedMember(
  db: FakeFirestore,
  groupId: string,
  userId: string,
  data: Partial<Record<string, unknown>> = {}
) {
  const joinedAt = ts('2026-06-20T01:00:00.000Z');
  db.seed(`waterGroups/${groupId}/members/${userId}`, {
    lineUserId: userId,
    displayName: data.displayName ?? userId,
    pictureUrl: data.pictureUrl ?? '',
    todayMl: data.todayMl ?? 0,
    todayDate: data.todayDate ?? '2026-06-20',
    weekMl: data.weekMl ?? 0,
    totalMl: data.totalMl ?? 0,
    streak: data.streak ?? 0,
    achievements: data.achievements ?? [],
    lastDrinkAt: data.lastDrinkAt ?? null,
    joinedAt,
    updatedAt: joinedAt,
  });
}

function seedRecord(
  db: FakeFirestore,
  groupId: string,
  recordId: string,
  data: Partial<Record<string, unknown>> = {}
) {
  const timestamp = (data.timestamp as Timestamp | undefined) ?? ts('2026-06-20T01:00:00.000Z');
  db.seed(`waterGroups/${groupId}/records/${recordId}`, {
    id: recordId,
    lineUserId: data.lineUserId ?? 'U1',
    displayName: data.displayName ?? 'U1',
    ml: data.ml ?? 200,
    drinkType: data.drinkType ?? 'water',
    date: data.date ?? '2026-06-20',
    timestamp,
    createdAt: timestamp,
  });
}

describe('waterService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-20T01:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ensureIdentity creates waterUsers/member on first visit and reuses them on revisit', async () => {
    const db = new FakeFirestore();

    const first = await ensureIdentity(
      db as never,
      { groupId: 'C123', groupName: '讀書會' },
      { userId: 'U1', displayName: 'Dev', pictureUrl: 'https://example.com/u1.png' }
    );

    expect(first.isNewUser).toBe(true);
    expect(db.read('waterUsers/U1')).toEqual(expect.objectContaining({ lastGroupId: 'C123' }));
    expect(db.read('waterGroups/C123/members/U1')).toEqual(expect.objectContaining({ todayMl: 0, streak: 0 }));

    jest.setSystemTime(new Date('2026-06-20T02:00:00.000Z'));
    const second = await ensureIdentity(
      db as never,
      { groupId: 'C123', groupName: '讀書會' },
      { userId: 'U1', displayName: 'Dev Updated', pictureUrl: 'https://example.com/u1b.png' }
    );

    expect(second.isNewUser).toBe(false);
    expect(second.user.displayName).toBe('Dev Updated');
    expect(second.user.firstSeenAt).toEqual(first.user.firstSeenAt);
    expect(second.user.lastSeenAt._seconds).toBeGreaterThan(first.user.lastSeenAt._seconds);
  });

  it('logDrink writes a record and updates member totals', async () => {
    const db = new FakeFirestore();

    const result = await logDrink(
      db as never,
      'C123',
      { userId: 'U1', displayName: 'Dev', pictureUrl: '' },
      { ml: 500, drinkType: 'water', groupName: '讀書會' }
    );

    expect(result.member.todayMl).toBe(500);
    expect(result.member.totalMl).toBe(500);
    expect(result.member.weekMl).toBe(500);
    expect(result.member.streak).toBe(1);
    expect(result.newPersistentAchievements).toContain('first_drink');
    expect(db.query('records', true)).toHaveLength(1);
  });

  it('calculates surpassedCount and now_im_best when the user jumps to first place', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 3);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 100, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 200, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U3', { displayName: 'Cara', todayMl: 300, todayDate: '2026-06-20' });

    const result = await logDrink(
      db as never,
      'C123',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 250, drinkType: 'water' }
    );

    expect(result.rankBefore).toBe(3);
    expect(result.rankAfter).toBe(1);
    expect(result.surpassedCount).toBe(2);
    expect(result.eventAchievements).toContain('now_im_best');
  });

  it('fires now_im_best when the current leader keeps the lead', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 2);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 1000, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 600, todayDate: '2026-06-20' });

    const result = await logDrink(
      db as never,
      'C123',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 100, drinkType: 'tea' }
    );

    expect(result.rankBefore).toBe(1);
    expect(result.rankAfter).toBe(1);
    expect(result.eventAchievements).toContain('now_im_best');
  });

  it('fires now_im_worst only when the user stays last in a multi-member group', async () => {
    const multi = new FakeFirestore();
    seedGroup(multi, 'C123', '讀書會', 2);
    seedMember(multi, 'C123', 'U1', { displayName: 'Amy', todayMl: 100, todayDate: '2026-06-20' });
    seedMember(multi, 'C123', 'U2', { displayName: 'Ben', todayMl: 500, todayDate: '2026-06-20' });

    const worst = await logDrink(
      multi as never,
      'C123',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 50, drinkType: 'coffee' }
    );

    expect(worst.eventAchievements).toContain('now_im_worst');

    const single = new FakeFirestore();
    const singleResult = await logDrink(
      single as never,
      'Solo',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 50, drinkType: 'coffee', groupName: 'Solo' }
    );

    expect(singleResult.eventAchievements).not.toContain('now_im_worst');
  });

  it('keeps streak on a continued next day, does not double-count same-day drinks, and resets after a skipped day', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', {
      displayName: 'Amy',
      todayMl: 800,
      todayDate: '2026-06-20',
      totalMl: 800,
      streak: 3,
      lastDrinkAt: ts('2026-06-20T10:00:00.000+08:00'),
    });

    jest.setSystemTime(new Date('2026-06-21T01:00:00.000Z'));
    const nextDay = await logDrink(
      db as never,
      'C123',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 200, drinkType: 'water' }
    );
    expect(nextDay.member.streak).toBe(4);

    const sameDay = await logDrink(
      db as never,
      'C123',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 100, drinkType: 'water' }
    );
    expect(sameDay.member.streak).toBe(4);

    const patch = resetDayIfNeeded(
      {
        todayDate: '2026-06-21',
        todayMl: 300,
        streak: 4,
        lastDrinkAt: ts('2026-06-21T12:00:00.000+08:00'),
      },
      '2026-06-23'
    );
    expect(patch).toEqual({ todayMl: 0, todayDate: '2026-06-23', streak: 0 });
  });

  it('builds leaderboard rows with gaps and lead-over-second values', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 3);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 900, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 750, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U3', { displayName: 'Cara', todayMl: 500, todayDate: '2026-06-20' });

    const leaderboard = await getTodayLeaderboard(db as never, 'C123', 'U2');

    expect(leaderboard.memberCount).toBe(3);
    expect(leaderboard.members[0]).toEqual(expect.objectContaining({ lineUserId: 'U1', rank: 1, leadOverSecond: 150 }));
    expect(leaderboard.members[1]).toEqual(expect.objectContaining({ lineUserId: 'U2', rank: 2, gapToAbove: 150 }));
    expect(leaderboard.me).toEqual(expect.objectContaining({ lineUserId: 'U2', rank: 2, aboveDisplayName: 'Amy' }));
  });

  it('unlocks hydration_master on the fifth drink and never duplicates persistent achievements', async () => {
    const db = new FakeFirestore();

    const first = await logDrink(
      db as never,
      'C123',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 100, drinkType: 'water', groupName: '讀書會' }
    );
    expect(first.newPersistentAchievements).toContain('first_drink');

    let fifthResult = first;
    for (let index = 0; index < 4; index += 1) {
      fifthResult = await logDrink(
        db as never,
        'C123',
        { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
        { ml: 100, drinkType: 'water' }
      );
    }

    expect(fifthResult.newPersistentAchievements).toContain('hydration_master');

    const sixth = await logDrink(
      db as never,
      'C123',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 100, drinkType: 'water' }
    );
    expect(sixth.newPersistentAchievements).not.toContain('hydration_master');

    const profile = await getMemberProfile(db as never, 'C123', 'U1');
    expect(profile.member.achievements.filter((achievement) => achievement === 'hydration_master')).toHaveLength(1);
  });

  it('returns taunts from the fixed pool of ten messages', () => {
    expect(TAUNT_MESSAGES).toHaveLength(10);
    TAUNT_MESSAGES.forEach((message, index) => {
      expect(getRandomTaunt(index)).toBe(message);
    });
  });

  it('updates week totals from records when reading profile data', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 500, todayDate: '2026-06-20' });
    seedRecord(db, 'C123', 'r1', { lineUserId: 'U1', displayName: 'Amy', ml: 300, date: '2026-06-18' });
    seedRecord(db, 'C123', 'r2', { lineUserId: 'U1', displayName: 'Amy', ml: 500, date: '2026-06-20' });

    const profile = await getMemberProfile(db as never, 'C123', 'U1');

    expect(profile.member.weekMl).toBe(800);
  });
});
