import { z } from 'zod';
import { attemptInputSchema } from '../domain/validation';

export const createSourceSchema = z.strictObject({
  requestId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().max(200).optional(),
  url: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'Only http/https URLs are allowed')
    .optional(),
  learningObjective: z.string().trim().max(500).optional(),
  body: z.string().min(1).refine((value) => Array.from(value).length <= 50_000, 'Source exceeds 50,000 characters'),
});

export const retryRunSchema = z.strictObject({});

export const createRoundSchema = z.strictObject({
  sourceId: z.string().min(1).max(128).nullable().optional(),
});

export const submitAttemptSchema = attemptInputSchema;

export const challengeReportSchema = z.strictObject({
  issue: z.enum(['ambiguous', 'wrong_evidence', 'other']),
  detail: z.string().trim().max(500).nullable().optional(),
});

export const patchKnowledgeSchema = z.strictObject({
  excludedByUser: z.boolean(),
});
