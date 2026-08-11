import { z } from 'zod';
import type { AttemptInput, InternalChallenge, PublicChallenge } from './model';

const idSchema = z.string().min(1).max(128);
const supportLevelSchema = z.enum(['none', 'hint_1', 'hint_2', 'answer', 'skip']);

export const attemptInputSchema: z.ZodType<AttemptInput> = z
  .strictObject({
    challengeId: idSchema,
    firstAnswerId: idSchema.nullable(),
    finalAnswerId: idSchema.nullable(),
    supportLevel: supportLevelSchema,
    answerRevealed: z.boolean(),
    skipped: z.boolean(),
    responseMs: z.number().int().min(0).max(1_800_000).nullable(),
  })
  .superRefine((input, context) => {
    const addIssue = (message: string) =>
      context.addIssue({ code: 'custom', message });

    if (input.skipped) {
      if (input.supportLevel !== 'skip') {
        addIssue('skipped attempts must use skip support level');
      }
      if (input.firstAnswerId !== null || input.finalAnswerId !== null) {
        addIssue('skipped attempts cannot include answer ids');
      }
      if (input.answerRevealed) {
        addIssue('skipped attempts cannot reveal the answer');
      }
    }

    if (input.supportLevel === 'skip' && !input.skipped) {
      addIssue('skip support level requires skipped true');
    }

    if (input.answerRevealed && input.supportLevel !== 'answer') {
      addIssue('answer reveal requires answer support level');
    }

    if (input.supportLevel === 'none' && input.finalAnswerId === null) {
      addIssue('unsupported attempts require a final answer');
    }

    if (input.supportLevel === 'hint_1' || input.supportLevel === 'hint_2') {
      if (input.finalAnswerId === null) {
        addIssue('hinted attempts require a final answer');
      }
      if (input.answerRevealed) {
        addIssue('hinted attempts cannot reveal the answer');
      }
      if (input.skipped) {
        addIssue('hinted attempts cannot be skipped');
      }
    }

    if (input.supportLevel === 'answer') {
      if (input.finalAnswerId !== null) {
        addIssue('answer reveal attempts cannot include a final answer');
      }
      if (!input.answerRevealed) {
        addIssue('answer support level requires answerRevealed true');
      }
      if (input.skipped) {
        addIssue('answer reveal attempts cannot be skipped');
      }
    }
  });

export function toPublicChallenge(
  challenge: InternalChallenge,
  resolvedExcerptEn = 'excerptEn' in challenge ? challenge.excerptEn : '',
): PublicChallenge {
  return {
    id: challenge.id,
    facet: challenge.facet,
    taskMode: challenge.taskMode,
    excerptEn: resolvedExcerptEn,
    promptZh: challenge.promptZh,
    options: challenge.options.map((option) => ({ id: option.id, text: option.text })),
    hints: [...challenge.hints],
    contextProvenance: challenge.contextProvenance,
    recommendedSupport: challenge.recommendedSupport,
  };
}
