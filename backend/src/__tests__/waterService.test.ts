import { Timestamp } from 'firebase-admin/firestore';
import {
  assertUserCanAccessWaterGroup,
  TAUNT_MESSAGES,
  ensureIdentity,
  getMemberProfile,
  getGroupPulse,
  getRandomTaunt,
  getTodayLeaderboard,
  listWaterMembersForAdmin,
  isValidLineGroupId,
  logDrink,
  resolveWaterSession,
  resetMemberTodayWater,
  resetDayIfNeeded,
  setWaterGroupEnabled,
  WaterGroupAccessError,
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
  private readonly maxCount: number | null;

  constructor(
    private readonly db: FakeFirestore,
    private readonly path: string,
    private readonly isCollectionGroup: boolean,
    filters: Array<{ fieldPath: string; opStr: WhereOp; value: unknown }> = [],
    orders: Array<{ fieldPath: string; directionStr: OrderDirection }> = [],
    maxCount: number | null = null
  ) {
    this.filters = filters;
    this.orders = orders;
    this.maxCount = maxCount;
  }

  where(fieldPath: string, opStr: WhereOp, value: unknown) {
    return new FakeQuery(this.db, this.path, this.isCollectionGroup, [...this.filters, { fieldPath, opStr, value }], this.orders, this.maxCount);
  }

  orderBy(fieldPath: string, directionStr: OrderDirection = 'asc') {
    return new FakeQuery(this.db, this.path, this.isCollectionGroup, this.filters, [...this.orders, { fieldPath, directionStr }], this.maxCount);
  }

  limit(count: number) {
    return new FakeQuery(this.db, this.path, this.isCollectionGroup, this.filters, this.orders, count);
  }

  async get() {
    let docs = this.db.query(this.path, this.isCollectionGroup)
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

    if (this.maxCount !== null) {
      docs = docs.slice(0, this.maxCount);
    }

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

  delete(ref: FakeDocumentReference) {
    this.writes.push(() => this.db.delete(ref.path));
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

  delete(path: string) {
    this.docs.delete(path);
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
    isEnabled: false,
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
    expect(db.read('waterUsers/U1')).toEqual(expect.objectContaining({ lastGroupId: 'C123', groupIds: ['C123'] }));
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
    expect(db.query('records', true)).toHaveLength(2);
    expect(db.read('waterUsers/U1')).toEqual(expect.objectContaining({
      totalMl: 500,
      streak: 1,
      achievements: expect.arrayContaining(['first_drink']),
    }));
    expect(db.read('waterUsers/U1/records/doc_1')).toEqual(expect.objectContaining({
      groupId: 'C123',
      ml: 500,
    }));
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

  it('keeps todayMl after leaving and re-entering the page on the same day (same group)', async () => {
    const db = new FakeFirestore();

    // Session 1: user opens the page and logs a drink.
    const logged = await logDrink(
      db as never,
      'C123',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 500, drinkType: 'water', groupName: '讀書會' }
    );
    expect(logged.member.todayMl).toBe(500);

    // Session 2 (same day): user leaves and re-enters. The real flow runs
    // ensureIdentity first, then getTodayLeaderboard (see routes/api/water.ts).
    await ensureIdentity(db as never, { groupId: 'C123' }, {
      userId: 'U1',
      displayName: 'Amy',
      pictureUrl: '',
    });
    const reopened = await getTodayLeaderboard(db as never, 'C123', 'U1');

    expect(reopened.me.todayMl).toBe(500);
  });

  it('is group-scoped: a different groupId reads an empty total (why a stable group id matters)', async () => {
    const db = new FakeFirestore();

    // Drink logged under the group the request resolved to.
    await logDrink(
      db as never,
      'C-real-group',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 500, drinkType: 'water', groupName: '讀書會' }
    );

    // Reading under a different group id finds no records — this is exactly the
    // data split that the production bug caused (a new group id per launch), and
    // the reason resolveGroupId must collapse requests onto one stable group.
    await ensureIdentity(db as never, { groupId: 'C-other-context' }, {
      userId: 'U1',
      displayName: 'Amy',
      pictureUrl: '',
    });
    const reopened = await getTodayLeaderboard(db as never, 'C-other-context', 'U1');

    expect(reopened.me.todayMl).toBe(0);
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

  it('rebuilds today total from same-day records when member aggregate is stale', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 0, todayDate: '2026-06-20' });
    seedRecord(db, 'C123', 'r1', { lineUserId: 'U1', displayName: 'Amy', ml: 300, date: '2026-06-20' });
    seedRecord(db, 'C123', 'r2', { lineUserId: 'U1', displayName: 'Amy', ml: 200, date: '2026-06-20' });

    const profile = await getMemberProfile(db as never, 'C123', 'U1');

    expect(profile.member.todayMl).toBe(500);
    expect(db.read('waterGroups/C123/members/U1')).toEqual(expect.objectContaining({ todayMl: 500 }));
  });

  it('adds new drinks on top of same-day records when member aggregate is stale', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 0, todayDate: '2026-06-20' });
    seedRecord(db, 'C123', 'r1', { lineUserId: 'U1', displayName: 'Amy', ml: 300, date: '2026-06-20' });

    const result = await logDrink(
      db as never,
      'C123',
      { userId: 'U1', displayName: 'Amy', pictureUrl: '' },
      { ml: 200, drinkType: 'water' }
    );

    expect(result.member.todayMl).toBe(500);
    expect(db.read('waterGroups/C123/members/U1')).toEqual(expect.objectContaining({ todayMl: 500 }));
  });

  it('lists admin water members with rank ordering', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 2);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 700, weekMl: 900, totalMl: 2000, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 300, weekMl: 500, totalMl: 1500, todayDate: '2026-06-20' });

    const members = await listWaterMembersForAdmin(db as never, 'C123');

    expect(members).toEqual([
      expect.objectContaining({ lineUserId: 'U1', rank: 1, todayMl: 700 }),
      expect.objectContaining({ lineUserId: 'U2', rank: 2, todayMl: 300 }),
    ]);
  });

  it('resets a member today water by deleting today records and rebuilding aggregates', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', {
      displayName: 'Amy',
      todayMl: 500,
      todayDate: '2026-06-20',
      weekMl: 900,
      totalMl: 2000,
      streak: 4,
      lastDrinkAt: ts('2026-06-20T10:00:00.000+08:00'),
    });
    seedRecord(db, 'C123', 'r1', { lineUserId: 'U1', displayName: 'Amy', ml: 300, date: '2026-06-20' });
    seedRecord(db, 'C123', 'r2', { lineUserId: 'U1', displayName: 'Amy', ml: 200, date: '2026-06-20' });
    seedRecord(db, 'C123', 'r3', { lineUserId: 'U1', displayName: 'Amy', ml: 400, date: '2026-06-18' });

    const result = await resetMemberTodayWater(db as never, 'C123', 'U1');

    expect(result.removedMl).toBe(500);
    expect(result.removedRecordCount).toBe(2);
    expect(result.member).toEqual(expect.objectContaining({
      lineUserId: 'U1',
      todayMl: 0,
      weekMl: 400,
      totalMl: 1500,
      streak: 4,
    }));
    expect(db.read('waterGroups/C123/records/r1')).toBeUndefined();
    expect(db.read('waterGroups/C123/records/r2')).toBeUndefined();
    expect(db.read('waterGroups/C123/records/r3')).toEqual(expect.objectContaining({ ml: 400 }));
    expect(db.read('waterGroups/C123/members/U1')).toEqual(expect.objectContaining({
      todayMl: 0,
      weekMl: 400,
      totalMl: 1500,
      streak: 4,
    }));
    expect(db.read('waterUsers/U1/records/r1')).toBeUndefined();
    expect(db.read('waterUsers/U1/records/r2')).toBeUndefined();
  });
});

describe('water gamification (BE-1~BE-5, BE-8)', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-20T01:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // BE-1: group goal computation
  it('BE-1: computes group goal correctly (not yet reached)', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 3);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 600, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 500, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U3', { displayName: 'Cara', todayMl: 400, todayDate: '2026-06-20' });

    const leaderboard = await getTodayLeaderboard(db as never, 'C123', 'U1');
    expect(leaderboard.group.todayMl).toBe(1500);
    expect(leaderboard.group.goalMl).toBe(4500); // 3 × 1500
    expect(leaderboard.group.goalReached).toBe(false);
    expect(leaderboard.group.perMemberBaselineMl).toBe(1500);
  });

  it('BE-1: detects group goal reached', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 3);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 2000, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 2000, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U3', { displayName: 'Cara', todayMl: 1000, todayDate: '2026-06-20' });

    const leaderboard = await getTodayLeaderboard(db as never, 'C123', 'U1');
    expect(leaderboard.group.todayMl).toBe(5000);
    expect(leaderboard.group.goalMl).toBe(4500);
    expect(leaderboard.group.goalReached).toBe(true);
  });

  // BE-2: lastDrinkAt in leaderboard rows
  it('BE-2: leaderboard rows include lastDrinkAt (null when never drunk)', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 2);
    const drinkTs = ts('2026-06-20T08:00:00.000Z');
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 500, todayDate: '2026-06-20', lastDrinkAt: drinkTs });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 300, todayDate: '2026-06-20', lastDrinkAt: null });

    const leaderboard = await getTodayLeaderboard(db as never, 'C123', 'U1');
    const amy = leaderboard.members.find((m) => m.lineUserId === 'U1')!;
    const ben = leaderboard.members.find((m) => m.lineUserId === 'U2')!;

    expect(amy.lastDrinkAt).not.toBeNull();
    expect(amy.lastDrinkAt!._seconds).toBe(drinkTs.seconds);
    expect(ben.lastDrinkAt).toBeNull();
  });

  // BE-3: me.aboveLastDrinkAt and me.belowDisplayName
  it('BE-3: me row includes aboveLastDrinkAt and belowDisplayName', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 3);
    const ts1 = ts('2026-06-20T08:00:00.000Z');
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 900, todayDate: '2026-06-20', lastDrinkAt: ts1 });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 700, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U3', { displayName: 'Cara', todayMl: 500, todayDate: '2026-06-20' });

    // Ben is rank 2; above = Amy (has lastDrinkAt), below = Cara
    const leaderboard = await getTodayLeaderboard(db as never, 'C123', 'U2');
    expect(leaderboard.me.rank).toBe(2);
    expect(leaderboard.me.aboveLastDrinkAt).not.toBeNull();
    expect(leaderboard.me.aboveLastDrinkAt!._seconds).toBe(ts1.seconds);
    expect(leaderboard.me.belowDisplayName).toBe('Cara');
  });

  it('BE-3: first place has null aboveLastDrinkAt, last place has null belowDisplayName', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 2);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 900, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 500, todayDate: '2026-06-20' });

    const first = await getTodayLeaderboard(db as never, 'C123', 'U1');
    expect(first.me.aboveLastDrinkAt).toBeNull();
    expect(first.me.belowDisplayName).toBe('Ben');

    const last = await getTodayLeaderboard(db as never, 'C123', 'U2');
    expect(last.me.aboveDisplayName).toBe('Amy');
    expect(last.me.belowDisplayName).toBeNull();
  });

  // BE-4: pulse sorted by newest first
  it('BE-4: pulse returns today records ordered newest first', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 2);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 700, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 300, todayDate: '2026-06-20' });
    seedRecord(db, 'C123', 'r1', { lineUserId: 'U1', displayName: 'Amy', ml: 500, date: '2026-06-20', timestamp: ts('2026-06-20T00:30:00.000Z') });
    seedRecord(db, 'C123', 'r2', { lineUserId: 'U2', displayName: 'Ben', ml: 300, date: '2026-06-20', timestamp: ts('2026-06-20T00:45:00.000Z') });
    seedRecord(db, 'C123', 'r3', { lineUserId: 'U1', displayName: 'Amy', ml: 200, date: '2026-06-20', timestamp: ts('2026-06-20T01:00:00.000Z') });

    const result = await getGroupPulse(db as never, 'C123', 20);
    expect(result.pulse).toHaveLength(3);
    // newest first
    expect(result.pulse[0].ml).toBe(200);
    expect(result.pulse[1].ml).toBe(300);
    expect(result.pulse[2].ml).toBe(500);
    // rankNow corresponds to current leaderboard (Amy has 700ml → rank 1)
    expect(result.pulse[0].rankNow).toBe(1); // Amy's record, she's rank 1
    expect(result.pulse[1].rankNow).toBe(2); // Ben's record, he's rank 2
  });

  it('BE-4: pulse respects limit and returns empty array for empty group', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 0, todayDate: '2026-06-20' });

    const result = await getGroupPulse(db as never, 'C123', 5);
    expect(result.pulse).toEqual([]);

    // limit is capped at 50
    const db2 = new FakeFirestore();
    seedGroup(db2, 'C123', '讀書會', 1);
    seedMember(db2, 'C123', 'U1', { displayName: 'Amy', todayMl: 0, todayDate: '2026-06-20' });
    for (let i = 0; i < 60; i++) {
      seedRecord(db2, 'C123', `r${i}`, { lineUserId: 'U1', displayName: 'Amy', ml: 100, date: '2026-06-20' });
    }
    const limited = await getGroupPulse(db2 as never, 'C123', 100);
    expect(limited.pulse.length).toBeLessThanOrEqual(50);
  });

  // BE-5: logDrink new fields
  it('BE-5: comboCount counts records within 90-minute window', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 0, todayDate: '2026-06-20' });

    // first drink — comboCount should be 1 (just this one, no prior in window)
    const first = await logDrink(db as never, 'C123', { userId: 'U1', displayName: 'Amy', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(first.comboCount).toBe(1);
    expect(first.groupDrinkSequence).toBe(1);

    // second drink — within 90 min window → comboCount should be 2
    const second = await logDrink(db as never, 'C123', { userId: 'U1', displayName: 'Amy', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(second.comboCount).toBe(2);
    expect(second.groupDrinkSequence).toBe(2);
  });

  it('BE-5: comboCount ignores records older than 90 minutes', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 200, todayDate: '2026-06-20' });
    // old record: 91 minutes before "now" (2026-06-20T01:00:00Z)
    seedRecord(db, 'C123', 'old', {
      lineUserId: 'U1',
      displayName: 'Amy',
      ml: 200,
      date: '2026-06-20',
      timestamp: ts('2026-06-19T23:29:00.000Z'), // 91 min before
    });

    const result = await logDrink(db as never, 'C123', { userId: 'U1', displayName: 'Amy', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(result.comboCount).toBe(1);
  });

  it('BE-5: groupGoalJustReached fires once per day and not again', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 2);
    // Both members at 700ml; goal = 2 × 1500 = 3000. Adding 200 each to get to 3000.
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 1400, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 1400, todayDate: '2026-06-20' });
    // Seed 1400 ml worth of records for each (so normalized totals match)
    seedRecord(db, 'C123', 'r1u1', { lineUserId: 'U1', ml: 1400, date: '2026-06-20', timestamp: ts('2026-06-20T00:00:00.000Z') });
    seedRecord(db, 'C123', 'r1u2', { lineUserId: 'U2', ml: 1400, date: '2026-06-20', timestamp: ts('2026-06-20T00:00:00.000Z') });

    // U1 drinks 200 → total = 1600+1400 = 3000 = goalMl → justReached!
    const first = await logDrink(db as never, 'C123', { userId: 'U1', displayName: 'Amy', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(first.groupGoalJustReached).toBe(true);
    expect(first.groupGoalMl).toBe(3000);

    // U2 drinks again → goal was already reached today, so groupGoalJustReached = false
    const second = await logDrink(db as never, 'C123', { userId: 'U2', displayName: 'Ben', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(second.groupGoalJustReached).toBe(false);
  });

  it('BE-5: groupTodayMl and belowDisplayName are computed from afterMembers', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 3);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 600, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 400, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U3', { displayName: 'Cara', todayMl: 200, todayDate: '2026-06-20' });
    seedRecord(db, 'C123', 'ru1', { lineUserId: 'U1', ml: 600, date: '2026-06-20', timestamp: ts('2026-06-20T00:00:00.000Z') });
    seedRecord(db, 'C123', 'ru2', { lineUserId: 'U2', ml: 400, date: '2026-06-20', timestamp: ts('2026-06-20T00:00:00.000Z') });
    seedRecord(db, 'C123', 'ru3', { lineUserId: 'U3', ml: 200, date: '2026-06-20', timestamp: ts('2026-06-20T00:00:00.000Z') });

    // Ben logs 300ml → becomes rank 1 (900ml), Amy stays rank 2 (600), Cara rank 3
    const result = await logDrink(db as never, 'C123', { userId: 'U2', displayName: 'Ben', pictureUrl: '' }, { ml: 300, drinkType: 'water' });
    expect(result.groupTodayMl).toBe(600 + 700 + 200); // 1500
    expect(result.rankAfter).toBe(1);
    expect(result.belowDisplayName).toBe('Amy'); // rank 2 after Ben's jump to 1
  });

  // BE-8: M6 daily first logger
  it('BE-8: isDailyFirst is true for group first drink and sets group fields', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 2);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 0, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 0, todayDate: '2026-06-20' });

    const first = await logDrink(db as never, 'C123', { userId: 'U1', displayName: 'Amy', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(first.isDailyFirst).toBe(true);
    expect(first.eventAchievements).toContain('daily_first');
    const groupDoc = db.read('waterGroups/C123');
    expect(groupDoc?.['firstLoggerDate']).toBe('2026-06-20');
    expect(groupDoc?.['firstLoggerDisplayName']).toBe('Amy');

    // Second drink same day from different user → isDailyFirst = false
    const second = await logDrink(db as never, 'C123', { userId: 'U2', displayName: 'Ben', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(second.isDailyFirst).toBe(false);
    expect(second.eventAchievements).not.toContain('daily_first');
  });

  it('BE-8: isDailyFirst resets each day', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 0, todayDate: '2026-06-20' });

    // Today's first drink
    const today = await logDrink(db as never, 'C123', { userId: 'U1', displayName: 'Amy', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(today.isDailyFirst).toBe(true);

    // Next day
    jest.setSystemTime(new Date('2026-06-21T01:00:00.000Z'));
    const nextDay = await logDrink(db as never, 'C123', { userId: 'U1', displayName: 'Amy', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(nextDay.isDailyFirst).toBe(true);
  });

  it('BE-8: daily_first is event-only — not written to member.achievements', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 1);
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 0, todayDate: '2026-06-20' });

    const result = await logDrink(db as never, 'C123', { userId: 'U1', displayName: 'Amy', pictureUrl: '' }, { ml: 200, drinkType: 'water' });
    expect(result.isDailyFirst).toBe(true);
    expect(result.member.achievements).not.toContain('daily_first');
    expect(result.newPersistentAchievements).not.toContain('daily_first');
    expect(result.eventAchievements).toContain('daily_first');
  });

  it('BE-8: firstLoggerDisplayName returned from getTodayLeaderboard group field', async () => {
    const db = new FakeFirestore();
    seedGroup(db, 'C123', '讀書會', 2);
    db.seed('waterGroups/C123', {
      ...(db.read('waterGroups/C123') ?? {}),
      firstLoggerDate: '2026-06-20',
      firstLoggerDisplayName: 'Amy',
    });
    seedMember(db, 'C123', 'U1', { displayName: 'Amy', todayMl: 200, todayDate: '2026-06-20' });
    seedMember(db, 'C123', 'U2', { displayName: 'Ben', todayMl: 0, todayDate: '2026-06-20' });

    const leaderboard = await getTodayLeaderboard(db as never, 'C123', 'U1');
    expect(leaderboard.group.firstLoggerDisplayName).toBe('Amy');
  });
});

describe('water group activation and session resolution', () => {
  const GROUP_A = 'C140df0374a3ba2a5864bcff0cbf8befd';
  const GROUP_B = 'C36f826d26cf8adefe4d214993742c230';
  const GROUP_C = 'Cabcabcabcabcabcabcabcabcabcabcab';
  const INVALID_ENTRY = '0559b5ee-5dbb-477e-ba0d-8452cd69faed';

  it('accepts only real LINE group/room ids', () => {
    expect(isValidLineGroupId(GROUP_A)).toBe(true);
    expect(isValidLineGroupId(`R${GROUP_A.slice(1)}`)).toBe(true);
    expect(isValidLineGroupId(INVALID_ENTRY)).toBe(false);
    expect(isValidLineGroupId('Cdev1')).toBe(false);
  });

  it('first visit from an enabled entry auto-binds the user to that group', async () => {
    const db = new FakeFirestore();
    seedGroup(db, GROUP_A, '測試用');
    await setWaterGroupEnabled(db as never, GROUP_A, { enabled: true, groupName: '測試用' });

    const resolved = await resolveWaterSession(db as never, 'U1', { entryGroupId: GROUP_A });
    expect('status' in resolved).toBe(false);

    if ('status' in resolved) throw new Error('unexpected selection');

    await ensureIdentity(db as never, resolved, { userId: 'U1', displayName: 'Amy', pictureUrl: '' });
    expect(db.read(`waterGroups/${GROUP_A}/members/U1`)).toEqual(expect.objectContaining({ lineUserId: 'U1' }));
    expect(db.read('waterUsers/U1')).toEqual(expect.objectContaining({ lastGroupId: GROUP_A, groupIds: [GROUP_A] }));
  });

  it('second visit from the same enabled group goes straight in', async () => {
    const db = new FakeFirestore();
    seedGroup(db, GROUP_A, '測試用');
    await setWaterGroupEnabled(db as never, GROUP_A, { enabled: true, groupName: '測試用' });
    await ensureIdentity(db as never, { groupId: GROUP_A, groupName: '測試用' }, { userId: 'U1', displayName: 'Amy', pictureUrl: '' });

    await expect(resolveWaterSession(db as never, 'U1', { entryGroupId: GROUP_A })).resolves.toEqual({
      groupId: GROUP_A,
      groupName: '測試用',
    });
  });

  it('adds a second membership when the user enters from another enabled group', async () => {
    const db = new FakeFirestore();
    seedGroup(db, GROUP_A, '測試用');
    seedGroup(db, GROUP_B, '最佳專輯封面人物六人組');
    await setWaterGroupEnabled(db as never, GROUP_A, { enabled: true, groupName: '測試用' });
    await setWaterGroupEnabled(db as never, GROUP_B, { enabled: true, groupName: '最佳專輯封面人物六人組' });
    await ensureIdentity(db as never, { groupId: GROUP_A, groupName: '測試用' }, { userId: 'U1', displayName: 'Amy', pictureUrl: '' });

    const resolved = await resolveWaterSession(db as never, 'U1', { entryGroupId: GROUP_B });
    if ('status' in resolved) throw new Error('unexpected selection');

    await ensureIdentity(db as never, resolved, { userId: 'U1', displayName: 'Amy', pictureUrl: '' });
    expect(db.read('waterUsers/U1')).toEqual(expect.objectContaining({ groupIds: [GROUP_A, GROUP_B], lastGroupId: GROUP_B }));
    expect(db.read(`waterGroups/${GROUP_B}/members/U1`)).toEqual(expect.objectContaining({ lineUserId: 'U1' }));
  });

  it('returns a selectable group list after the user has multiple bindings', async () => {
    const db = new FakeFirestore();
    seedGroup(db, GROUP_A, '測試用');
    seedGroup(db, GROUP_B, '最佳專輯封面人物六人組');
    seedGroup(db, GROUP_C, '第三群');
    await setWaterGroupEnabled(db as never, GROUP_A, { enabled: true, groupName: '測試用' });
    await setWaterGroupEnabled(db as never, GROUP_B, { enabled: true, groupName: '最佳專輯封面人物六人組' });
    await setWaterGroupEnabled(db as never, GROUP_C, { enabled: true, groupName: '第三群' });
    await ensureIdentity(db as never, { groupId: GROUP_A, groupName: '測試用' }, { userId: 'U1', displayName: 'Amy', pictureUrl: '' });
    await ensureIdentity(db as never, { groupId: GROUP_B, groupName: '最佳專輯封面人物六人組' }, { userId: 'U1', displayName: 'Amy', pictureUrl: '' });

    const resolved = await resolveWaterSession(db as never, 'U1', { entryGroupId: GROUP_C });
    expect(resolved).toEqual({
      status: 'needs_group_selection',
      user: expect.objectContaining({ lineUserId: 'U1', groupIds: [GROUP_A, GROUP_B] }),
      entryGroup: { groupId: GROUP_C, groupName: '第三群' },
      availableGroups: expect.arrayContaining([
        expect.objectContaining({ groupId: GROUP_A }),
        expect.objectContaining({ groupId: GROUP_B }),
        expect.objectContaining({ groupId: GROUP_C, isEntryGroup: true }),
      ]),
    });
  });

  it('rejects an entry group that has not been enabled', async () => {
    const db = new FakeFirestore();
    seedGroup(db, GROUP_A, '測試用');

    await expect(resolveWaterSession(db as never, 'U1', { entryGroupId: GROUP_A })).rejects.toMatchObject({
      code: 'water_group_not_enabled',
    } satisfies Partial<WaterGroupAccessError>);
  });

  it('allows access only to groups that the user is already bound to', async () => {
    const db = new FakeFirestore();
    seedGroup(db, GROUP_A, '測試用');
    seedGroup(db, GROUP_B, '最佳專輯封面人物六人組');
    await setWaterGroupEnabled(db as never, GROUP_A, { enabled: true, groupName: '測試用' });
    await setWaterGroupEnabled(db as never, GROUP_B, { enabled: true, groupName: '最佳專輯封面人物六人組' });
    await ensureIdentity(db as never, { groupId: GROUP_A, groupName: '測試用' }, { userId: 'U1', displayName: 'Amy', pictureUrl: '' });

    await expect(assertUserCanAccessWaterGroup(db as never, 'U1', GROUP_A)).resolves.toBe(GROUP_A);
    await expect(assertUserCanAccessWaterGroup(db as never, 'U1', GROUP_B)).rejects.toMatchObject({
      code: 'water_group_forbidden',
    } satisfies Partial<WaterGroupAccessError>);
  });
});
