import { validateMessagePlan, validateExtractedKnowledge } from '../services/planValidator';

// ─── validateMessagePlan ──────────────────────────────────────────────────────

describe('validateMessagePlan', () => {
  const validDraft = {
    content: '活動即將開始！',
    triggerValue: '2025-05-10T10:00:00+08:00',
    sequenceOrder: 1,
    targetGroups: ['all'],
  };

  it('passes a valid single message', () => {
    const result = validateMessagePlan([validDraft]);
    expect(result.valid).toBe(true);
    expect(result.feedback).toBe('');
  });

  it('passes multiple valid messages', () => {
    const result = validateMessagePlan([
      validDraft,
      { ...validDraft, sequenceOrder: 2, triggerValue: '2025-05-11T10:00:00+08:00' },
    ]);
    expect(result.valid).toBe(true);
  });

  it('fails on empty array', () => {
    const result = validateMessagePlan([]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('為空');
  });

  it('fails on empty content', () => {
    const result = validateMessagePlan([{ ...validDraft, content: '' }]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('[0].content');
  });

  it('fails on content exceeding 5000 chars', () => {
    const result = validateMessagePlan([{ ...validDraft, content: 'a'.repeat(5001) }]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('5000');
  });

  it('fails on invalid ISO datetime', () => {
    const result = validateMessagePlan([{ ...validDraft, triggerValue: '2025-05-10 10:00' }]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('[0].triggerValue');
  });

  it('fails on non-number sequenceOrder', () => {
    const result = validateMessagePlan([{ ...validDraft, sequenceOrder: '1' as unknown as number }]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('[0].sequenceOrder');
  });

  it('fails on duplicate sequenceOrders', () => {
    const result = validateMessagePlan([validDraft, { ...validDraft, triggerValue: '2025-05-11T10:00:00+08:00' }]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('重複');
  });

  it('fails on empty targetGroups', () => {
    const result = validateMessagePlan([{ ...validDraft, targetGroups: [] }]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('[0].targetGroups');
  });

  it('accepts UTC timezone (Z suffix)', () => {
    const result = validateMessagePlan([{ ...validDraft, triggerValue: '2025-05-10T02:00:00Z' }]);
    expect(result.valid).toBe(true);
  });
});

// ─── validateExtractedKnowledge ───────────────────────────────────────────────

describe('validateExtractedKnowledge', () => {
  const validItem = { knowledgeType: 'background', title: '故事背景', content: '密室逃脫活動' };

  it('passes valid knowledge items', () => {
    const result = validateExtractedKnowledge([validItem]);
    expect(result.valid).toBe(true);
  });

  it('passes all valid knowledgeTypes', () => {
    for (const t of ['background', 'restriction', 'character', 'faq']) {
      expect(validateExtractedKnowledge([{ ...validItem, knowledgeType: t }]).valid).toBe(true);
    }
  });

  it('fails on invalid knowledgeType', () => {
    const result = validateExtractedKnowledge([{ ...validItem, knowledgeType: 'invalid' }]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('[0].knowledgeType');
  });

  it('fails on empty title', () => {
    const result = validateExtractedKnowledge([{ ...validItem, title: '' }]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('[0].title');
  });

  it('fails on empty content', () => {
    const result = validateExtractedKnowledge([{ ...validItem, content: '   ' }]);
    expect(result.valid).toBe(false);
    expect(result.feedback).toContain('[0].content');
  });
});
