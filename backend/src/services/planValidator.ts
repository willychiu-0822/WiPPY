export interface ValidationResult {
  valid: boolean;
  feedback: string;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/;

export function validateMessagePlan(
  drafts: Array<{ content?: unknown; triggerValue?: unknown; sequenceOrder?: unknown; targetGroups?: unknown }>
): ValidationResult {
  const issues: string[] = [];
  if (drafts.length === 0) issues.push('規劃結果為空，必須包含至少一則訊息');

  const seen = new Set<number>();
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    if (!d.content || typeof d.content !== 'string' || !d.content.trim()) issues.push(`[${i}].content 不可為空`);
    if (typeof d.content === 'string' && d.content.length > 5000) issues.push(`[${i}].content 超過 5000 字元`);
    if (typeof d.triggerValue !== 'string' || !ISO_RE.test(d.triggerValue)) issues.push(`[${i}].triggerValue 不是有效 ISO datetime`);
    if (typeof d.sequenceOrder !== 'number') issues.push(`[${i}].sequenceOrder 必須為數字`);
    if (typeof d.sequenceOrder === 'number' && seen.has(d.sequenceOrder)) issues.push(`[${i}].sequenceOrder 重複: ${d.sequenceOrder}`);
    if (typeof d.sequenceOrder === 'number') seen.add(d.sequenceOrder);
    if (!Array.isArray(d.targetGroups) || (d.targetGroups as unknown[]).length === 0) issues.push(`[${i}].targetGroups 不可為空`);
  }

  return { valid: issues.length === 0, feedback: issues.join('\n') };
}

export function validateExtractedKnowledge(
  items: Array<{ knowledgeType?: unknown; title?: unknown; content?: unknown }>
): ValidationResult {
  const valid = ['background', 'restriction', 'character', 'faq'];
  const issues: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (typeof item.knowledgeType !== 'string' || !valid.includes(item.knowledgeType)) issues.push(`[${i}].knowledgeType 無效`);
    if (!item.title || typeof item.title !== 'string' || !item.title.trim()) issues.push(`[${i}].title 不可為空`);
    if (!item.content || typeof item.content !== 'string' || !item.content.trim()) issues.push(`[${i}].content 不可為空`);
  }
  return { valid: issues.length === 0, feedback: issues.join('\n') };
}
