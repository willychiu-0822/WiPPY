import { Timestamp } from 'firebase-admin/firestore';
import type {
  Activity,
  ActivityReviewStatus,
  ActivityMessage,
  MessageReviewStatus,
  ActivityKnowledge,
  KnowledgeType,
  KnowledgeSourceType,
  AgentSession,
  AgentSessionMessage,
  AgentSessionStatus,
} from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const now = Timestamp.now();

// ── Activity ───────────────────────────────────────────────────────────────────

describe('Activity', () => {
  const base: Activity = {
    id: 'act_1',
    userId: 'user_1',
    name: '密室逃脫暖場企畫',
    targetGroups: ['group_a', 'group_b'],
    status: 'draft',
    reviewStatus: 'pending_review',
    approvedAt: null,
    agentSessionId: null,
    eventStartAt: null,
    eventEndAt: null,
    createdAt: now,
    updatedAt: now,
  };

  it('accepts draft + pending_review as initial state', () => {
    expect(base.status).toBe('draft');
    expect(base.reviewStatus).toBe('pending_review');
  });

  it('accepts all valid reviewStatus values', () => {
    const statuses: ActivityReviewStatus[] = [
      'pending_review',
      'approved',
      'revision_requested',
    ];
    statuses.forEach((s) => {
      const a: Activity = { ...base, reviewStatus: s };
      expect(a.reviewStatus).toBe(s);
    });
  });

  it('approvedAt is set when activity is approved', () => {
    const approved: Activity = {
      ...base,
      status: 'active',
      reviewStatus: 'approved',
      approvedAt: now,
    };
    expect(approved.approvedAt).not.toBeNull();
    expect(approved.approvedAt).toBe(now);
  });

  it('agentSessionId links to an AgentSession', () => {
    const linked: Activity = { ...base, agentSessionId: 'session_1' };
    expect(linked.agentSessionId).toBe('session_1');
  });

  it('eventStartAt / eventEndAt are nullable (lifecycle binding is optional)', () => {
    expect(base.eventStartAt).toBeNull();
    expect(base.eventEndAt).toBeNull();

    const withDates: Activity = {
      ...base,
      eventStartAt: now,
      eventEndAt: now,
    };
    expect(withDates.eventStartAt).toBe(now);
    expect(withDates.eventEndAt).toBe(now);
  });
});

// ── ActivityMessage ────────────────────────────────────────────────────────────

describe('ActivityMessage', () => {
  const base: ActivityMessage = {
    id: 'msg_1',
    activityId: 'act_1',
    userId: 'user_1',
    content: '活動即將開始，敬請期待！',
    targetGroups: ['group_a'],
    triggerType: 'scheduled',
    triggerValue: '2025-05-10T10:00:00+08:00',
    cooldownMinutes: null,
    status: 'pending',
    reviewStatus: 'pending_review',
    generatedByAgent: false,
    agentSessionId: null,
    sequenceOrder: 1,
    sendWindowStart: null,
    sendWindowEnd: null,
    sentAt: null,
    processingAt: null,
    createdAt: now,
    updatedAt: now,
  };

  it('defaults to pending + pending_review before approval', () => {
    expect(base.status).toBe('pending');
    expect(base.reviewStatus).toBe('pending_review');
  });

  it('accepts all valid MessageReviewStatus values', () => {
    const statuses: MessageReviewStatus[] = [
      'pending_review',
      'approved',
      'rejected',
    ];
    statuses.forEach((s) => {
      const m: ActivityMessage = { ...base, reviewStatus: s };
      expect(m.reviewStatus).toBe(s);
    });
  });

  it('generatedByAgent is true for Agent-created messages', () => {
    const agentMsg: ActivityMessage = {
      ...base,
      generatedByAgent: true,
      agentSessionId: 'session_1',
    };
    expect(agentMsg.generatedByAgent).toBe(true);
    expect(agentMsg.agentSessionId).toBe('session_1');
  });

  it('sequenceOrder determines campaign ordering', () => {
    const msgs: ActivityMessage[] = [1, 2, 3].map((order) => ({
      ...base,
      id: `msg_${order}`,
      sequenceOrder: order,
    }));
    const sorted = [...msgs].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    expect(sorted.map((m) => m.sequenceOrder)).toEqual([1, 2, 3]);
  });

  it('processingAt acts as dedup lock — null when not being processed', () => {
    expect(base.processingAt).toBeNull();

    const locked: ActivityMessage = { ...base, processingAt: now };
    expect(locked.processingAt).not.toBeNull();
  });

  it('sendWindowStart / sendWindowEnd are nullable', () => {
    expect(base.sendWindowStart).toBeNull();
    expect(base.sendWindowEnd).toBeNull();

    const windowed: ActivityMessage = {
      ...base,
      sendWindowStart: now,
      sendWindowEnd: now,
    };
    expect(windowed.sendWindowStart).toBe(now);
    expect(windowed.sendWindowEnd).toBe(now);
  });

  it('scheduler should skip messages where reviewStatus is not approved', () => {
    const shouldSend = (msg: ActivityMessage) =>
      msg.status === 'pending' &&
      msg.reviewStatus === 'approved' &&
      msg.processingAt === null;

    expect(shouldSend(base)).toBe(false); // pending_review blocks sending
    expect(shouldSend({ ...base, reviewStatus: 'approved' })).toBe(true);
    expect(
      shouldSend({ ...base, reviewStatus: 'approved', processingAt: now })
    ).toBe(false); // locked
  });
});

// ── ActivityKnowledge ──────────────────────────────────────────────────────────

describe('ActivityKnowledge', () => {
  const base: ActivityKnowledge = {
    id: 'know_1',
    activityId: 'act_1',
    userId: 'user_1',
    knowledgeType: 'background',
    title: '故事背景',
    content: '這是一場以 1920 年代上海為背景的密室逃脫活動。',
    sourceType: 'manual',
    targetGroupId: null,
    createdAt: now,
    updatedAt: now,
  };

  it('accepts all valid knowledgeType values', () => {
    const types: KnowledgeType[] = [
      'background',
      'restriction',
      'character',
      'faq',
    ];
    types.forEach((t) => {
      const k: ActivityKnowledge = { ...base, knowledgeType: t };
      expect(k.knowledgeType).toBe(t);
    });
  });

  it('accepts all valid sourceType values', () => {
    const sources: KnowledgeSourceType[] = [
      'manual',
      'upload',
      'agent_generated',
    ];
    sources.forEach((s) => {
      const k: ActivityKnowledge = { ...base, sourceType: s };
      expect(k.sourceType).toBe(s);
    });
  });

  it('targetGroupId is null for activity-wide knowledge', () => {
    expect(base.targetGroupId).toBeNull();
  });

  it('targetGroupId set to groupId for group-specific tone override', () => {
    const groupSpecific: ActivityKnowledge = {
      ...base,
      targetGroupId: 'group_a',
    };
    expect(groupSpecific.targetGroupId).toBe('group_a');
  });

  it('faq type is reserved for Scene 2 — should not affect Scene 1 flow', () => {
    const faq: ActivityKnowledge = {
      ...base,
      knowledgeType: 'faq',
      title: 'Q: 活動幾點開始？',
      content: 'A: 晚上 7 點。',
    };
    expect(faq.knowledgeType).toBe('faq');
  });
});

// ── AgentSession ───────────────────────────────────────────────────────────────

describe('AgentSession', () => {
  const msg: AgentSessionMessage = {
    role: 'user',
    content: '幫我規劃三則暖場訊息',
    timestamp: now,
  };

  const base: AgentSession = {
    id: 'session_1',
    activityId: 'act_1',
    userId: 'user_1',
    messages: [msg],
    lastGeneratedPlanAt: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  it('accepts all valid AgentSessionStatus values', () => {
    const statuses: AgentSessionStatus[] = ['active', 'closed'];
    statuses.forEach((s) => {
      const session: AgentSession = { ...base, status: s };
      expect(session.status).toBe(s);
    });
  });

  it('messages array holds conversation history', () => {
    expect(base.messages).toHaveLength(1);
    expect(base.messages[0].role).toBe('user');
    expect(base.messages[0].content).toBe('幫我規劃三則暖場訊息');
  });

  it('accepts system / user / assistant roles in messages', () => {
    const roles: AgentSessionMessage['role'][] = [
      'system',
      'user',
      'assistant',
    ];
    roles.forEach((role) => {
      const m: AgentSessionMessage = { role, content: 'test', timestamp: now };
      expect(m.role).toBe(role);
    });
  });

  it('lastGeneratedPlanAt is null until Agent produces first plan', () => {
    expect(base.lastGeneratedPlanAt).toBeNull();

    const afterPlan: AgentSession = { ...base, lastGeneratedPlanAt: now };
    expect(afterPlan.lastGeneratedPlanAt).toBe(now);
  });

  it('messages can accumulate a full conversation turn', () => {
    const fullConversation: AgentSession = {
      ...base,
      messages: [
        { role: 'system', content: 'You are WiPPY...', timestamp: now },
        { role: 'user', content: '幫我規劃三則暖場訊息', timestamp: now },
        { role: 'assistant', content: '[{"content":"..."}]', timestamp: now },
      ],
    };
    expect(fullConversation.messages).toHaveLength(3);
    expect(fullConversation.messages[2].role).toBe('assistant');
  });
});
