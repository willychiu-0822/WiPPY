/**
 * Real-Firestore integration + load tests for the water tracker.
 *
 * Unlike the FakeFirestore unit tests, these run the production service code
 * against the Firestore emulator, which enforces the real 500-op batch limit
 * and runs real optimistic-concurrency transactions (contention + retries).
 * That makes them able to prove things the mock cannot: no lost updates under
 * concurrent drinks, correct aggregates under load, and that large-scale batch
 * writes do not blow Firestore's hard limits.
 *
 * Run with:  npm run test:emulator
 * (skips automatically when FIRESTORE_EMULATOR_HOST is not set)
 */
import * as admin from 'firebase-admin';

const EMULATOR = !!process.env['FIRESTORE_EMULATOR_HOST'];
const d = EMULATOR ? describe : describe.skip;

process.env['FIREBASE_PROJECT_ID'] = process.env['FIREBASE_PROJECT_ID'] || 'demo-wippy';

// Import after env is set so getDb() targets the emulator.
import {
  setWaterGroupEnabled,
  resolveWaterSession,
  ensureIdentity,
  logDrink,
  getTodayLeaderboard,
  getWeeklyStats,
  assertUserCanAccessWaterGroup,
  resetMemberTodayWater,
  resetDailyWater,
  getTaipeiDateString,
} from '../services/waterService';
import { getDb } from '../firebase';

function hex(n: number): string {
  return n.toString(16).padStart(32, '0').slice(0, 32);
}
let groupSeq = 0;
function newGroupId(): string {
  groupSeq += 1;
  return `C${hex(Date.now() + groupSeq)}`;
}

async function clearCollectionGroup(name: string): Promise<void> {
  const snap = await getDb().collectionGroup(name).get();
  let batch = getDb().batch();
  let count = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    count += 1;
    if (count % 400 === 0) {
      await batch.commit();
      batch = getDb().batch();
    }
  }
  if (count % 400 !== 0) await batch.commit();
}

d('water tracker — real Firestore emulator', () => {
  jest.setTimeout(120_000);

  afterAll(async () => {
    await Promise.all(admin.apps.map((app) => app?.delete()));
  });

  it('E2E: new user onboarding → first drink → leaderboard → admin reset', async () => {
    const db = getDb();
    const groupId = newGroupId();
    const user = { userId: `U${Date.now()}a`, displayName: '小明', pictureUrl: '' };

    // Admin enables the group (CRUD).
    const enabled = await setWaterGroupEnabled(db, groupId, { enabled: true, groupName: '讀書會' });
    expect(enabled.isEnabled).toBe(true);

    // New user lands via the group LIFF link → session resolves straight to the group.
    const session = await resolveWaterSession(db, user.userId, { entryGroupId: groupId, entryGroupName: '讀書會' });
    expect('groupId' in session && session.groupId).toBe(groupId);

    // Identity is created on first visit.
    const identity = await ensureIdentity(db, { groupId, groupName: '讀書會' }, user);
    expect(identity.isNewUser).toBe(true);
    expect(identity.member.todayMl).toBe(0);

    // Access check passes now that the user is bound.
    await expect(assertUserCanAccessWaterGroup(db, user.userId, groupId)).resolves.toBe(groupId);

    // First drink.
    const drink = await logDrink(db, groupId, user, { ml: 300, drinkType: 'water', groupName: '讀書會' });
    expect(drink.member.todayMl).toBe(300);
    expect(drink.record.ml).toBe(300);

    // Leaderboard reflects the drink and lists the user as "me".
    const board = await getTodayLeaderboard(db, groupId, user.userId);
    expect(board.me.todayMl).toBe(300);
    expect(board.memberCount).toBe(1);
    expect(board.group.todayMl).toBe(300);

    // Weekly stats include today's total.
    const stats = await getWeeklyStats(db, groupId);
    const today = getTaipeiDateString();
    expect(stats.dailyTotals.find((row) => row.date === today)?.totalMl).toBe(300);

    // Admin resets the member's day (CRUD).
    const reset = await resetMemberTodayWater(db, groupId, user.userId);
    expect(reset.removedMl).toBe(300);
    const afterReset = await getTodayLeaderboard(db, groupId, user.userId);
    expect(afterReset.me.todayMl).toBe(0);
  });

  it('LOAD: no lost updates when one user fires many concurrent drinks', async () => {
    const db = getDb();
    const groupId = newGroupId();
    const user = { userId: `U${Date.now()}solo`, displayName: '阿水', pictureUrl: '' };
    await setWaterGroupEnabled(db, groupId, { enabled: true, groupName: '單人壓測' });
    await ensureIdentity(db, { groupId, groupName: '單人壓測' }, user);

    const drinks = 10; // a user spam-tapping the log button
    const ml = 120;
    const results = await Promise.allSettled(
      Array.from({ length: drinks }, () => logDrink(db, groupId, user, { ml, drinkType: 'water' }))
    );

    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(0);

    // The whole point: real transactions must not lose any write.
    const board = await getTodayLeaderboard(db, groupId, user.userId);
    expect(board.me.todayMl).toBe(drinks * ml);
    expect(board.group.todayMl).toBe(drinks * ml);
  });

  it('LOAD: many users drinking concurrently keep aggregates and ranks consistent', async () => {
    const db = getDb();
    const groupId = newGroupId();
    const userCount = 20;
    const drinksPerUser = 6;
    const ml = 150;
    const users = Array.from({ length: userCount }, (_, i) => ({
      userId: `U${Date.now()}_${i}`,
      displayName: `U${i}`,
      pictureUrl: '',
    }));

    await setWaterGroupEnabled(db, groupId, { enabled: true, groupName: '多人壓測' });
    await Promise.all(users.map((u) => ensureIdentity(db, { groupId, groupName: '多人壓測' }, u)));

    // Realistic flash crowd: each wave is every distinct user drinking once at the
    // same moment (concurrent across distinct member docs — the launch scenario),
    // repeated over several waves. This isolates the cross-user contention we fixed.
    for (let wave = 0; wave < drinksPerUser; wave += 1) {
      const results = await Promise.allSettled(
        users.map((u) => logDrink(db, groupId, u, { ml, drinkType: 'water' }))
      );
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(rejected).toHaveLength(0);
    }

    const board = await getTodayLeaderboard(db, groupId, users[0]!.userId);
    const expectedPerUser = drinksPerUser * ml;
    expect(board.memberCount).toBe(userCount);
    for (const row of board.members) {
      expect(row.todayMl).toBe(expectedPerUser);
    }
    expect(board.group.todayMl).toBe(userCount * expectedPerUser);
    const ranks = board.members.map((r) => r.rank).sort((a, b) => a - b);
    expect(ranks).toEqual(users.map((_, i) => i + 1));
  });

  it('SCALE: daily reset chunks past the real 500-op batch limit', async () => {
    const db = getDb();
    await clearCollectionGroup('members');

    const total = 550; // exceeds Firestore's hard 500-op batch limit
    const yesterday = '2000-01-01'; // any past date forces a reset
    let batch = db.batch();
    const groupA = newGroupId();
    const groupB = newGroupId();
    for (let i = 0; i < total; i += 1) {
      const groupId = i % 2 === 0 ? groupA : groupB;
      const ref = db.collection('waterGroups').doc(groupId).collection('members').doc(`U${i}`);
      batch.set(ref, {
        lineUserId: `U${i}`,
        displayName: `U${i}`,
        pictureUrl: '',
        todayMl: 999,
        todayDate: yesterday,
        weekMl: 0,
        totalMl: 999,
        streak: 0,
        achievements: [],
        lastDrinkAt: null,
        joinedAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
      if ((i + 1) % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    await batch.commit();

    // Would throw INVALID_ARGUMENT on a single >500-op batch; must succeed chunked.
    const resetCount = await resetDailyWater(db);
    expect(resetCount).toBe(total);

    const today = getTaipeiDateString();
    const check = await db.collection('waterGroups').doc(groupA).collection('members').doc('U0').get();
    expect(check.data()).toMatchObject({ todayMl: 0, todayDate: today });

    await clearCollectionGroup('members');
  });
});
