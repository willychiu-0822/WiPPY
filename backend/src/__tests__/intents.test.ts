jest.mock('../services/persistenceAdapter', () => ({
  persistEffects: jest.fn(),
}));

import { persistEffects } from '../services/persistenceAdapter';
import { planMessages } from '../harness/intents/planMessages';
import { extractKnowledge } from '../harness/intents/extractKnowledge';
import { generalChat } from '../harness/intents/generalChat';
import { intentRegistry } from '../harness/intents/registry';
import type { ContextEnvelope } from '../services/contextBuilder';
import type { PersistMeta } from '../harness/intents/types';

const ctx = { activity: { targetGroups: ['group_a'] } } as unknown as ContextEnvelope;

const meta: PersistMeta = {
  activityId: 'a1',
  userId: 'u1',
  runId: 'r1',
  agentSessionId: 's1',
  activityTargetGroups: ['group_a'],
};

const PLAN_JSON = JSON.stringify([
  { content: '訊息一', targetGroups: ['all'], triggerValue: '2026-05-01T10:00:00+08:00', sequenceOrder: 1 },
]);

const KNOWLEDGE_REPLY = '好的\nEXTRACTED_KNOWLEDGE:\n[{"knowledgeType":"background","title":"標題","content":"內容"}]';

beforeEach(() => {
  jest.clearAllMocks();
  (persistEffects as jest.Mock).mockResolvedValue({ savedMessages: [], savedKnowledgeCount: 0, savedKnowledgeIds: [], batchCount: 1 });
});

// ─── planMessages ─────────────────────────────────────────────────────────────

describe('planMessages handler', () => {
  it('detects a valid JSON plan, including markdown-fenced JSON', () => {
    expect(planMessages.detect(PLAN_JSON)).toHaveLength(1);
    expect(planMessages.detect('```json\n' + PLAN_JSON + '\n```')).toHaveLength(1);
  });

  it('returns null for non-plan text', () => {
    expect(planMessages.detect('你好嗎')).toBeNull();
  });

  it('validates a good plan and rejects a bad one', () => {
    expect(planMessages.validate(JSON.parse(PLAN_JSON), ctx).valid).toBe(true);
    const bad = [{ content: '', targetGroups: ['all'], triggerValue: 'nope', sequenceOrder: 1 }];
    expect(planMessages.validate(bad as any, ctx).valid).toBe(false);
  });

  it('resolves ["all"] targetGroups and maps the persist result', async () => {
    (persistEffects as jest.Mock).mockResolvedValue({ savedMessages: [{ id: 'm1' }, { id: 'm2' }], savedKnowledgeCount: 0, savedKnowledgeIds: [], batchCount: 1 });
    const parsed = planMessages.detect(PLAN_JSON)!;
    const result = await planMessages.persist({} as any, parsed, meta);
    const [, drafts] = (persistEffects as jest.Mock).mock.calls[0];
    expect(drafts[0].targetGroups).toEqual(['group_a']);
    expect(result).toEqual({ savedCount: 2, ids: ['m1', 'm2'], batchCount: 1 });
  });

  it('finalizes with the planned-count message, or passes through when nothing saved', () => {
    expect(planMessages.finalize('raw', [], { savedCount: 3, ids: [], batchCount: 1 })).toContain('已為你規劃 3 則');
    expect(planMessages.finalize('原始', [], { savedCount: 0, ids: [], batchCount: 0 })).toBe('原始');
  });
});

// ─── extractKnowledge ─────────────────────────────────────────────────────────

describe('extractKnowledge handler', () => {
  it('detects an EXTRACTED_KNOWLEDGE block', () => {
    const parsed = extractKnowledge.detect(KNOWLEDGE_REPLY)!;
    expect(parsed[0].title).toBe('標題');
  });

  it('returns null when there is no knowledge block', () => {
    expect(extractKnowledge.detect('就是一般聊天')).toBeNull();
  });

  it('rejects empty title/content — the wired validateExtractedKnowledge gap', () => {
    expect(extractKnowledge.validate([{ knowledgeType: 'background', title: '', content: '內容' }], ctx).valid).toBe(false);
    expect(extractKnowledge.validate([{ knowledgeType: 'background', title: '標題', content: '內容' }], ctx).valid).toBe(true);
  });

  it('persists only knowledge and maps savedKnowledgeIds', async () => {
    (persistEffects as jest.Mock).mockResolvedValue({ savedMessages: [], savedKnowledgeCount: 1, savedKnowledgeIds: ['k1'], batchCount: 1 });
    const parsed = extractKnowledge.detect(KNOWLEDGE_REPLY)!;
    const result = await extractKnowledge.persist({} as any, parsed, meta);
    expect(result).toEqual({ savedCount: 1, ids: ['k1'], batchCount: 1 });
    const [, messages, knowledge] = (persistEffects as jest.Mock).mock.calls[0];
    expect(messages).toEqual([]);
    expect(knowledge[0].activityId).toBe('a1');
  });

  it('finalizes by stripping the knowledge block', () => {
    expect(extractKnowledge.finalize(KNOWLEDGE_REPLY, [], { savedCount: 1, ids: ['k1'], batchCount: 1 })).toBe('好的');
  });
});

// ─── generalChat ──────────────────────────────────────────────────────────────

describe('generalChat handler', () => {
  it('always detects and always validates', () => {
    expect(generalChat.detect('任何文字')).toBe('任何文字');
    expect(generalChat.validate('任何文字', ctx).valid).toBe(true);
  });

  it('persists nothing', async () => {
    const result = await generalChat.persist({} as any, 'x', meta);
    expect(result).toEqual({ savedCount: 0, ids: [], batchCount: 0 });
    expect(persistEffects).not.toHaveBeenCalled();
  });

  it('passes prose through and strips any stray knowledge block', () => {
    const noop = { savedCount: 0, ids: [], batchCount: 0 };
    expect(generalChat.finalize('純文字', '純文字', noop)).toBe('純文字');
    expect(generalChat.finalize('文字\nEXTRACTED_KNOWLEDGE:\n[{}]', '', noop)).toBe('文字');
  });
});

// ─── registry priority ────────────────────────────────────────────────────────

describe('intentRegistry priority', () => {
  function firstMatch(raw: string): string | null {
    for (const h of intentRegistry) {
      if (h.detect(raw) != null) return h.name;
    }
    return null;
  }

  it('is ordered plan > knowledge > chat', () => {
    expect(intentRegistry.map((h) => h.name)).toEqual(['plan_messages', 'extract_knowledge', 'general_chat']);
  });

  it('routes each reply shape to the right handler', () => {
    expect(firstMatch(PLAN_JSON)).toBe('plan_messages');
    expect(firstMatch(KNOWLEDGE_REPLY)).toBe('extract_knowledge');
    expect(firstMatch('你好，有什麼可以幫忙的？')).toBe('general_chat');
  });
});
