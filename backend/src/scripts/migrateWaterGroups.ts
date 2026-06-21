/**
 * One-off, idempotent migration that consolidates water records which were
 * scattered across ephemeral (non-LINE) group ids into a single stable group.
 *
 * Background: liff.getContext().groupId could return a fresh UUID per launch, so
 * each visit created a brand-new waterGroups/{uuid} document and the user's
 * records were split across many groups (todayMl read back as 0 on re-entry).
 * The app now resolves a stable group server-side; this script moves the data
 * that was already written under the bad ids into that stable group.
 *
 * Usage (PowerShell / bash):
 *   FIREBASE_PROJECT_ID=wippy-mvp \
 *   WATER_DEFAULT_GROUP_ID=C140df0374a3ba2a5864bcff0cbf8befd \
 *   npx ts-node src/scripts/migrateWaterGroups.ts [--dry-run]
 *
 * Requires Application Default Credentials (gcloud auth application-default login).
 * Safe to re-run: records are copied by id and member aggregates are recomputed
 * deterministically from records.
 */
import * as admin from 'firebase-admin';
import { formatInTimeZone } from 'date-fns-tz';
import { format as formatDate, subDays, parseISO } from 'date-fns';
import { getDb } from '../firebase';
import { isValidLineGroupId } from '../services/waterService';

const TZ = 'Asia/Taipei';
const WATER_GROUPS_COLLECTION = 'waterGroups';
const DRY_RUN = process.argv.includes('--dry-run');

interface RecordRow {
  id: string;
  lineUserId: string;
  displayName: string;
  ml: number;
  drinkType: string;
  date: string;
  timestamp: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
}

interface MemberInfo {
  displayName: string;
  pictureUrl: string;
  achievements: Set<string>;
  streak: number;
}

function todayStr(): string {
  return formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
}

function weekStartStr(today: string): string {
  return formatDate(subDays(parseISO(today), 6), 'yyyy-MM-dd');
}

async function main(): Promise<void> {
  const defaultGroupId = (process.env['WATER_DEFAULT_GROUP_ID'] ?? '').trim();
  if (!isValidLineGroupId(defaultGroupId)) {
    throw new Error(
      `WATER_DEFAULT_GROUP_ID must be a valid LINE group id, got "${defaultGroupId}"`
    );
  }

  const db = getDb();
  const today = todayStr();
  const weekStart = weekStartStr(today);

  const groupsSnap = await db.collection(WATER_GROUPS_COLLECTION).get();
  const sourceGroupIds = groupsSnap.docs
    .map((doc) => doc.id)
    .filter((id) => id !== defaultGroupId && !isValidLineGroupId(id));

  console.log(`Default (target) group: ${defaultGroupId}`);
  console.log(`Found ${sourceGroupIds.length} ephemeral source group(s) to consolidate.`);
  if (DRY_RUN) console.log('--- DRY RUN: no writes will be made ---');

  // Collect all records from source groups, deduped by record id.
  const records = new Map<string, RecordRow>();
  const members = new Map<string, MemberInfo>();

  for (const groupId of sourceGroupIds) {
    const groupRef = db.collection(WATER_GROUPS_COLLECTION).doc(groupId);
    const [recSnap, memSnap] = await Promise.all([
      groupRef.collection('records').get(),
      groupRef.collection('members').get(),
    ]);

    for (const doc of recSnap.docs) {
      const data = doc.data() as RecordRow;
      records.set(data.id ?? doc.id, { ...data, id: data.id ?? doc.id });
    }

    for (const doc of memSnap.docs) {
      const data = doc.data() as {
        lineUserId?: string;
        displayName?: string;
        pictureUrl?: string;
        achievements?: string[];
        streak?: number;
      };
      const userId = data.lineUserId ?? doc.id;
      const existing = members.get(userId) ?? {
        displayName: '',
        pictureUrl: '',
        achievements: new Set<string>(),
        streak: 0,
      };
      existing.displayName = data.displayName || existing.displayName;
      existing.pictureUrl = data.pictureUrl || existing.pictureUrl;
      for (const ach of data.achievements ?? []) existing.achievements.add(ach);
      existing.streak = Math.max(existing.streak, data.streak ?? 0);
      members.set(userId, existing);
    }
  }

  // Also fold in any records already present in the target group (idempotency).
  const targetRef = db.collection(WATER_GROUPS_COLLECTION).doc(defaultGroupId);
  const targetRecSnap = await targetRef.collection('records').get();
  for (const doc of targetRecSnap.docs) {
    const data = doc.data() as RecordRow;
    records.set(data.id ?? doc.id, { ...data, id: data.id ?? doc.id });
  }

  console.log(`Total unique records to live in target: ${records.size}`);
  console.log(`Distinct members: ${members.size}`);

  // Per-user aggregates recomputed deterministically from the record set.
  const agg = new Map<string, { total: number; todayMl: number; weekMl: number; last: admin.firestore.Timestamp | null }>();
  for (const rec of records.values()) {
    const a = agg.get(rec.lineUserId) ?? { total: 0, todayMl: 0, weekMl: 0, last: null };
    a.total += rec.ml;
    if (rec.date === today) a.todayMl += rec.ml;
    if (rec.date >= weekStart && rec.date <= today) a.weekMl += rec.ml;
    if (!a.last || rec.timestamp.toMillis() > a.last.toMillis()) a.last = rec.timestamp;
    agg.set(rec.lineUserId, a);
    if (!members.has(rec.lineUserId)) {
      members.set(rec.lineUserId, {
        displayName: rec.displayName,
        pictureUrl: '',
        achievements: new Set<string>(),
        streak: 0,
      });
    }
  }

  if (DRY_RUN) {
    for (const [userId, info] of members) {
      const a = agg.get(userId) ?? { total: 0, todayMl: 0, weekMl: 0, last: null };
      console.log(
        `  ${userId} (${info.displayName}): total=${a.total} today=${a.todayMl} week=${a.weekMl} streak=${info.streak}`
      );
    }
    console.log('Dry run complete. Re-run without --dry-run to apply.');
    return;
  }

  const now = admin.firestore.Timestamp.now();

  // Ensure the target group exists.
  await targetRef.set(
    {
      groupName: (await targetRef.get()).get('groupName') ?? '',
      memberCount: members.size,
      activeSince: (await targetRef.get()).get('activeSince') ?? now,
      createdAt: (await targetRef.get()).get('createdAt') ?? now,
      updatedAt: now,
    },
    { merge: true }
  );

  // Write records in batches.
  let writes = 0;
  let batch = db.batch();
  for (const rec of records.values()) {
    batch.set(targetRef.collection('records').doc(rec.id), rec, { merge: true });
    if (++writes % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`Wrote ${records.size} records into ${defaultGroupId}.`);

  // Write member docs with recomputed aggregates.
  for (const [userId, info] of members) {
    const a = agg.get(userId) ?? { total: 0, todayMl: 0, weekMl: 0, last: null };
    await targetRef.collection('members').doc(userId).set(
      {
        lineUserId: userId,
        displayName: info.displayName,
        pictureUrl: info.pictureUrl,
        todayMl: a.todayMl,
        todayDate: today,
        weekMl: a.weekMl,
        totalMl: a.total,
        streak: info.streak,
        achievements: [...info.achievements],
        lastDrinkAt: a.last,
        joinedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
  console.log(`Wrote ${members.size} member docs.`);
  console.log('Migration complete. Source groups were left untouched.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
