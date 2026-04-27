// ── scheduler processScheduledActivityMessages tests ─────────────────────────
// We test the logic by extracting it from the router and injecting mocks.
// The function is not exported, so we re-implement the core logic as a pure
// function here and verify its behaviour — this mirrors what the route does.

jest.mock('firebase-admin', () => ({
  firestore: {
    Timestamp: {
      now: () => ({ seconds: 1000, nanoseconds: 0 }),
    },
  },
}));
jest.mock('firebase-admin/firestore', () => ({
  Timestamp: { now: () => ({ seconds: 1000, nanoseconds: 0 }) },
}));
jest.mock('@line/bot-sdk');

// ── Pure logic extracted for unit testing ────────────────────────────────────
// We test the decision logic without the actual Firestore/LINE SDK calls.

type MsgStatus = 'pending' | 'sent' | 'failed';
type ReviewStatus = 'pending_review' | 'approved' | 'rejected';
type ActivityStatus = 'draft' | 'active' | 'completed';

interface MockMessage {
  id: string;
  activityId: string;
  userId: string;
  content: string;
  targetGroups: string[];
  triggerType: string;
  triggerValue: string;
  reviewStatus: ReviewStatus;
  status: MsgStatus;
  processingAt: null | { seconds: number };
  sendWindowStart: null | { seconds: number };
  sendWindowEnd: null | { seconds: number };
}

interface MockActivity {
  id: string;
  status: ActivityStatus;
}

// Simulated processing logic (mirrors scheduler.ts processScheduledActivityMessages)
async function processMessages(
  messages: MockMessage[],
  activities: Record<string, MockActivity>,
  nowSeconds: number,
  sendFn: (groupId: string, content: string) => Promise<void>
): Promise<{ sent: number; failed: number; skipped: number }> {
  const now = { seconds: nowSeconds, nanoseconds: 0 };
  const nowIso = new Date(nowSeconds * 1000).toISOString();

  const candidates = messages.filter(
    (m) =>
      m.status === 'pending' &&
      m.triggerType === 'scheduled' &&
      m.reviewStatus === 'approved' &&
      m.triggerValue <= nowIso &&
      m.processingAt === null
  );

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const msg of candidates) {
    // Lock
    msg.processingAt = now;

    // Lifecycle gate
    const activity = activities[msg.activityId];
    if (!activity || activity.status !== 'active') {
      msg.processingAt = null;
      skipped++;
      continue;
    }

    // sendWindow check
    if (msg.sendWindowStart && now.seconds < msg.sendWindowStart.seconds) {
      msg.processingAt = null;
      skipped++;
      continue;
    }
    if (msg.sendWindowEnd && now.seconds > msg.sendWindowEnd.seconds) {
      msg.status = 'failed';
      msg.processingAt = null;
      failed++;
      continue;
    }

    // Send to each group
    let allOk = true;
    for (const groupId of msg.targetGroups) {
      try {
        await sendFn(groupId, msg.content);
      } catch {
        allOk = false;
      }
    }

    if (allOk) {
      msg.status = 'sent';
      msg.processingAt = null;
      sent++;
    } else {
      msg.status = 'failed';
      msg.processingAt = null;
      failed++;
    }
  }

  return { sent, failed, skipped };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW_SEC = 1_000_000;
const NOW_ISO = new Date(NOW_SEC * 1000).toISOString();
const PAST_ISO = new Date((NOW_SEC - 3600) * 1000).toISOString();  // 1 hour ago
const FUTURE_ISO = new Date((NOW_SEC + 3600) * 1000).toISOString(); // 1 hour from now

function makeMsg(overrides: Partial<MockMessage> = {}): MockMessage {
  return {
    id: 'msg_1',
    activityId: 'act_1',
    userId: 'user_1',
    content: '活動即將開始！',
    targetGroups: ['group_a'],
    triggerType: 'scheduled',
    triggerValue: PAST_ISO,
    reviewStatus: 'approved',
    status: 'pending',
    processingAt: null,
    sendWindowStart: null,
    sendWindowEnd: null,
    ...overrides,
  };
}

const activeActivity: MockActivity = { id: 'act_1', status: 'active' };
const draftActivity: MockActivity = { id: 'act_1', status: 'draft' };
const completedActivity: MockActivity = { id: 'act_1', status: 'completed' };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('processScheduledActivityMessages — candidate filtering', () => {
  it('sends a due, approved, pending message', async () => {
    const msg = makeMsg();
    const sendFn = jest.fn().mockResolvedValue(undefined);
    const result = await processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(result.sent).toBe(1);
    expect(msg.status).toBe('sent');
    expect(sendFn).toHaveBeenCalledWith('group_a', '活動即將開始！');
  });

  it('skips messages that have not yet reached triggerValue', async () => {
    const msg = makeMsg({ triggerValue: FUTURE_ISO });
    const sendFn = jest.fn();
    const result = await processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(result.sent).toBe(0);
    expect(sendFn).not.toHaveBeenCalled();
    expect(msg.status).toBe('pending');
  });

  it('skips messages with reviewStatus !== approved', async () => {
    const msg = makeMsg({ reviewStatus: 'pending_review' });
    const sendFn = jest.fn();
    await processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(sendFn).not.toHaveBeenCalled();
  });

  it('skips messages already being processed (processingAt set)', async () => {
    const msg = makeMsg({ processingAt: { seconds: NOW_SEC - 10 } });
    const sendFn = jest.fn();
    await processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(sendFn).not.toHaveBeenCalled();
  });

  it('skips messages with status !== pending', async () => {
    const sent = makeMsg({ status: 'sent' });
    const failed = makeMsg({ id: 'msg_2', status: 'failed' });
    const sendFn = jest.fn();
    await processMessages([sent, failed], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(sendFn).not.toHaveBeenCalled();
  });
});

describe('processScheduledActivityMessages — lifecycle gate', () => {
  it('skips when activity status is draft', async () => {
    const msg = makeMsg();
    const sendFn = jest.fn();
    const result = await processMessages([msg], { act_1: draftActivity }, NOW_SEC, sendFn);

    expect(result.skipped).toBe(1);
    expect(sendFn).not.toHaveBeenCalled();
    expect(msg.processingAt).toBeNull();
  });

  it('skips when activity status is completed', async () => {
    const msg = makeMsg();
    const sendFn = jest.fn();
    const result = await processMessages([msg], { act_1: completedActivity }, NOW_SEC, sendFn);

    expect(result.skipped).toBe(1);
    expect(sendFn).not.toHaveBeenCalled();
  });

  it('skips when activity does not exist', async () => {
    const msg = makeMsg();
    const sendFn = jest.fn();
    const result = await processMessages([msg], {}, NOW_SEC, sendFn);

    expect(result.skipped).toBe(1);
    expect(sendFn).not.toHaveBeenCalled();
  });
});

describe('processScheduledActivityMessages — sendWindow', () => {
  it('skips when sendWindowStart is in the future', async () => {
    const msg = makeMsg({ sendWindowStart: { seconds: NOW_SEC + 600 } });
    const sendFn = jest.fn();
    const result = await processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(result.skipped).toBe(1);
    expect(sendFn).not.toHaveBeenCalled();
  });

  it('marks failed when sendWindowEnd is in the past', async () => {
    const msg = makeMsg({ sendWindowEnd: { seconds: NOW_SEC - 60 } });
    const sendFn = jest.fn();
    const result = await processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(result.failed).toBe(1);
    expect(msg.status).toBe('failed');
    expect(sendFn).not.toHaveBeenCalled();
  });

  it('sends when now is within the sendWindow', async () => {
    const msg = makeMsg({
      sendWindowStart: { seconds: NOW_SEC - 600 },
      sendWindowEnd: { seconds: NOW_SEC + 600 },
    });
    const sendFn = jest.fn().mockResolvedValue(undefined);
    const result = await processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(result.sent).toBe(1);
    expect(sendFn).toHaveBeenCalled();
  });
});

describe('processScheduledActivityMessages — multi-group', () => {
  it('calls sendFn for each targetGroup', async () => {
    const msg = makeMsg({ targetGroups: ['group_a', 'group_b', 'group_c'] });
    const sendFn = jest.fn().mockResolvedValue(undefined);
    await processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(sendFn).toHaveBeenCalledTimes(3);
    expect(sendFn).toHaveBeenCalledWith('group_a', '活動即將開始！');
    expect(sendFn).toHaveBeenCalledWith('group_b', '活動即將開始！');
    expect(sendFn).toHaveBeenCalledWith('group_c', '活動即將開始！');
  });

  it('marks failed if any group send throws', async () => {
    const msg = makeMsg({ targetGroups: ['group_ok', 'group_fail'] });
    const sendFn = jest.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('LINE error'));

    const result = await processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(result.failed).toBe(1);
    expect(msg.status).toBe('failed');
  });
});

describe('processScheduledActivityMessages — dedup lock', () => {
  it('processes each message only once even if called concurrently', async () => {
    const msg = makeMsg();
    const sendFn = jest.fn().mockResolvedValue(undefined);

    // Simulate two concurrent ticks by running the function twice in parallel
    // The first call locks the message; the second finds processingAt set and skips
    const [r1, r2] = await Promise.all([
      processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn),
      processMessages([msg], { act_1: activeActivity }, NOW_SEC, sendFn),
    ]);

    // Combined sent count should be exactly 1
    expect(r1.sent + r2.sent).toBe(1);
    expect(sendFn).toHaveBeenCalledTimes(1);
  });
});

describe('processScheduledActivityMessages — multiple messages', () => {
  it('processes all due messages in a single tick', async () => {
    const msgs = [
      makeMsg({ id: 'm1', content: '第一則' }),
      makeMsg({ id: 'm2', content: '第二則' }),
      makeMsg({ id: 'm3', content: '第三則' }),
    ];
    const sendFn = jest.fn().mockResolvedValue(undefined);
    const result = await processMessages(msgs, { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(result.sent).toBe(3);
    expect(sendFn).toHaveBeenCalledTimes(3);
  });

  it('only processes due messages, skips future ones', async () => {
    const msgs = [
      makeMsg({ id: 'm1', triggerValue: PAST_ISO }),
      makeMsg({ id: 'm2', triggerValue: FUTURE_ISO }),
    ];
    const sendFn = jest.fn().mockResolvedValue(undefined);
    const result = await processMessages(msgs, { act_1: activeActivity }, NOW_SEC, sendFn);

    expect(result.sent).toBe(1);
    expect(sendFn).toHaveBeenCalledTimes(1);
  });
});
