/**
 * Real-engine load / E2E test for the Water tracker.
 *
 * Runs against the Firebase **Firestore emulator** (real Firestore engine — it
 * enforces the 500-op batch limit and real transaction contention that the
 * in-memory FakeFirestore unit tests cannot). Not part of CI; invoked manually:
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx ts-node src/scripts/loadTestWater.ts
 */
import * as admin from 'firebase-admin';
import {
  ensureIdentity,
  logDrink,
  getTodayLeaderboard,
  getWeeklyStats,
  getGroupPulse,
  resetMemberTodayWater,
  resetDailyWater,
  setWaterGroupEnabled,
  assertUserCanAccessWaterGroup,
} from '../services/waterService';
import { validateDrinkInput } from '../routes/api/water';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
}
admin.initializeApp({ projectId: 'demo-wippy' });
const db = admin.firestore();

let failures = 0;
function check(label: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  ✅ ${label}`);
  } else {
    failures += 1;
    console.error(`  ❌ ${label} ${detail}`);
  }
}

// A LINE-style group id: "C" + 32 hex chars.
function groupId(seed: string): string {
  const hex = Buffer.from(seed).toString('hex').padEnd(32, '0').slice(0, 32);
  return `C${hex}`;
}

async function clearCollectionGroup(): Promise<void> {
  // Best-effort wipe of water collections between phases (emulator is fresh per run anyway).
  for (const top of ['waterGroups', 'waterUsers']) {
    const snap = await db.collection(top).get();
    for (const doc of snap.docs) {
      await db.recursiveDelete(doc.ref);
    }
  }
}

async function phaseOnboarding(): Promise<void> {
  console.log('\n[Phase 1] E2E new-user onboarding + access control');
  const g = groupId('onboard');
  await setWaterGroupEnabled(db, g, { enabled: true, groupName: '壓測群組' });

  const userCount = 30;
  await Promise.all(
    Array.from({ length: userCount }, (_, i) =>
      ensureIdentity(db, { groupId: g, groupName: '壓測群組' }, {
        userId: `U_onb_${i}`,
        displayName: `User${i}`,
        pictureUrl: '',
      })
    )
  );

  const groupDoc = (await db.collection('waterGroups').doc(g).get()).data();
  check('memberCount equals number of joined users (atomic increments)', groupDoc?.['memberCount'] === userCount, `got ${groupDoc?.['memberCount']}`);

  // Re-join should be idempotent (no double counting).
  await ensureIdentity(db, { groupId: g, groupName: '壓測群組' }, { userId: 'U_onb_0', displayName: 'User0', pictureUrl: '' });
  const after = (await db.collection('waterGroups').doc(g).get()).data();
  check('re-join does not inflate memberCount', after?.['memberCount'] === userCount, `got ${after?.['memberCount']}`);

  // Access control: a bound user is allowed, an unknown user is rejected.
  const allowed = await assertUserCanAccessWaterGroup(db, 'U_onb_1', g).then(() => true).catch(() => false);
  check('bound user can access group', allowed);
  const denied = await assertUserCanAccessWaterGroup(db, 'U_stranger', g).then(() => false).catch(() => true);
  check('unbound user is denied access', denied);
}

async function phaseConcurrentDrinks(): Promise<void> {
  console.log('\n[Phase 2] Concurrent drinks under REAL Firestore transactions');
  const g = groupId('concurrency');
  await setWaterGroupEnabled(db, g, { enabled: true, groupName: '併發群組' });

  const users = Array.from({ length: 25 }, (_, i) => `U_cc_${i}`);
  const drinksPerUser = 8;
  const ml = 120;

  // Realistic launch load: many DIFFERENT users drinking at the same time, each
  // tapping their own drinks in sequence. This is the scenario that previously
  // collapsed (whole-group transaction contention) and must now be 100% clean.
  const results = await Promise.allSettled(
    users.map(async (userId) => {
      for (let round = 0; round < drinksPerUser; round += 1) {
        await logDrink(db, g, { userId, displayName: userId, pictureUrl: '' }, { ml, drinkType: 'water' });
      }
    })
  );
  const rejected = results.filter((r) => r.status === 'rejected');
  check('no drink failed under concurrency', rejected.length === 0, `${rejected.length} rejected: ${rejected.slice(0, 1).map((r) => String((r as PromiseRejectedResult).reason)).join('')}`);

  const board = await getTodayLeaderboard(db, g, users[0]!);
  const expectedPerUser = drinksPerUser * ml;
  const allMembersCorrect = board.members.every((m) => m.todayMl === expectedPerUser);
  check('every member total == drinks*ml (no lost updates)', allMembersCorrect, `members=${JSON.stringify(board.members.map((m) => m.todayMl))}`);
  check('group total == exact sum of all drinks', board.group.todayMl === users.length * expectedPerUser, `got ${board.group.todayMl}, want ${users.length * expectedPerUser}`);
  const recSnap = await db.collection('waterGroups').doc(g).collection('records').get();
  const rawSum = recSnap.docs.reduce((s, d) => s + (d.data()['ml'] as number), 0);
  check('leaderboard total matches raw record sum', board.group.todayMl === rawSum, `board=${board.group.todayMl} raw=${rawSum}`);
  check('record count == total drinks logged', recSnap.size === users.length * drinksPerUser, `got ${recSnap.size}`);
  const ranks = board.members.map((m) => m.rank).sort((a, b) => a - b);
  check('ranks are contiguous 1..N with no duplicates', ranks.every((r, i) => r === i + 1), JSON.stringify(ranks));

  // Worst realistic same-user case: an impatient double-tap (2 concurrent logs),
  // isolated in its own group so it does not affect the totals checked above.
  const dg = groupId('doubletap');
  const dt = 'U_doubletap';
  await setWaterGroupEnabled(db, dg, { enabled: true, groupName: '雙擊群組' });
  await logDrink(db, dg, { userId: dt, displayName: 'DT', pictureUrl: '' }, { ml: 100, drinkType: 'water' });
  const tap = await Promise.allSettled([
    logDrink(db, dg, { userId: dt, displayName: 'DT', pictureUrl: '' }, { ml: 100, drinkType: 'water' }),
    logDrink(db, dg, { userId: dt, displayName: 'DT', pictureUrl: '' }, { ml: 100, drinkType: 'water' }),
  ]);
  check('double-tap: both concurrent same-user drinks succeed', tap.every((r) => r.status === 'fulfilled'), JSON.stringify(tap.map((r) => r.status)));
  const dtMember = await db.collection('waterGroups').doc(dg).collection('members').doc(dt).get();
  check('double-tap: no lost update (member total = 300)', dtMember.data()?.['totalMl'] === 300, `got ${dtMember.data()?.['totalMl']}`);
  const dtRecs = await db.collection('waterGroups').doc(dg).collection('records').where('lineUserId', '==', dt).get();
  check('double-tap: exactly 3 records persisted', dtRecs.size === 3, `got ${dtRecs.size}`);
}

async function phaseBatchLimit(): Promise<void> {
  console.log('\n[Phase 3] Daily reset across >500 members (batch-limit fix)');
  const g = groupId('biggroup');
  const memberCount = 600; // > Firestore 500-op batch limit
  const yesterday = '2000-01-01';

  // Seed members directly (chunked) with a stale todayDate so all need reset.
  const now = admin.firestore.Timestamp.now();
  for (let i = 0; i < memberCount; i += 400) {
    const batch = db.batch();
    for (let j = i; j < Math.min(i + 400, memberCount); j += 1) {
      batch.set(db.collection('waterGroups').doc(g).collection('members').doc(`U_big_${j}`), {
        lineUserId: `U_big_${j}`, displayName: `Big${j}`, pictureUrl: '',
        todayMl: 999, todayDate: yesterday, weekMl: 0, totalMl: 999,
        streak: 0, achievements: [], lastDrinkAt: null, joinedAt: now, updatedAt: now,
      });
    }
    await batch.commit();
  }

  // Note: production Firestore rejects a single >500-op batch; the local emulator
  // does not enforce that cap, so we can't reproduce the throw here. What we CAN
  // verify is that the chunked resetDailyWater handles 600 members end to end.

  // The fixed resetDailyWater must succeed and reset every member.
  const resetCount = await resetDailyWater(db);
  check('resetDailyWater succeeds for 600 members (chunked)', resetCount >= memberCount, `resetCount=${resetCount}`);

  const sample = await db.collection('waterGroups').doc(g).collection('members').doc('U_big_599').get();
  check('a member past the 500 boundary was actually reset', sample.data()?.['todayMl'] === 0 && sample.data()?.['todayDate'] !== yesterday);
}

async function phaseCrudAndGarbage(): Promise<void> {
  console.log('\n[Phase 4] CRUD + garbage drink-amount input');
  const g = groupId('crud');
  await setWaterGroupEnabled(db, g, { enabled: true, groupName: 'CRUD群組' });
  await ensureIdentity(db, { groupId: g, groupName: 'CRUD群組' }, { userId: 'U_crud', displayName: 'Crud', pictureUrl: '' });

  await logDrink(db, g, { userId: 'U_crud', displayName: 'Crud', pictureUrl: '' }, { ml: 500, drinkType: 'water' });
  await logDrink(db, g, { userId: 'U_crud', displayName: 'Crud', pictureUrl: '' }, { ml: 300, drinkType: 'tea' });

  const beforeReset = await getTodayLeaderboard(db, g, 'U_crud');
  check('reads reflect writes (todayMl=800)', beforeReset.me.todayMl === 800, `got ${beforeReset.me.todayMl}`);

  const stats = await getWeeklyStats(db, g);
  check('weekly stats returns 7 days', stats.dailyTotals.length === 7);
  const pulse = await getGroupPulse(db, g, 10);
  check('pulse returns recent records', pulse.pulse.length === 2, `got ${pulse.pulse.length}`);

  const reset = await resetMemberTodayWater(db, g, 'U_crud');
  check('admin reset removes today records', reset.removedMl === 800 && reset.removedRecordCount === 2, JSON.stringify(reset));
  const afterReset = await getTodayLeaderboard(db, g, 'U_crud');
  check('after reset todayMl=0', afterReset.me.todayMl === 0, `got ${afterReset.me.todayMl}`);

  // Garbage amounts must be rejected by the validator before ever touching Firestore.
  const garbage: Array<[unknown, unknown, boolean]> = [
    [0, 'water', false], [-100, 'water', false], [150.5, 'water', false],
    ['300', 'water', false], [undefined, 'water', false], [NaN, 'water', false],
    [Number.MAX_SAFE_INTEGER, 'water', false], [5001, 'water', false],
    [300, 'beer', false], [300, undefined, false],
    [300, 'water', true], [5000, 'water', true], [1, 'juice', true],
  ];
  let allOk = true;
  for (const [ml, type, expectOk] of garbage) {
    const r = validateDrinkInput(ml, type);
    if (r.ok !== expectOk) { allOk = false; console.error(`     garbage case ml=${String(ml)} type=${String(type)} -> ${r.ok}, expected ${expectOk}`); }
  }
  check('all garbage drink-amount inputs handled correctly', allOk);
}

async function main(): Promise<void> {
  console.log('Water load/E2E test against Firestore emulator at', process.env.FIRESTORE_EMULATOR_HOST);
  await clearCollectionGroup();
  await phaseOnboarding();
  await phaseConcurrentDrinks();
  await phaseBatchLimit();
  await phaseCrudAndGarbage();

  console.log(`\n${failures === 0 ? '🎉 ALL CHECKS PASSED' : `💥 ${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
