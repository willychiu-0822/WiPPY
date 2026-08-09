import { createHash } from 'crypto';
import type { ChallengeBuilder, LearningRepository } from './ports';
import type { LearningIdFactory } from './learningIds';
import type { AttemptInput, AttemptRecord, FacetMemory, InternalChallenge } from '../domain/model';
import { summarizeEvidence, type EvidenceSummary } from '../domain/evidence/summarizeEvidence';
import { updateMemory } from '../domain/memory/updateMemory';
import { attemptInputSchema } from '../domain/validation';

export interface ChallengeFeedback {
  correctOptionId: string;
  explanationZh: string;
  decisiveCluesZh: string[];
  optionExplanations: Array<{ optionId: string; explanationZh: string }>;
  evidence: InternalChallenge['evidence'];
  ambiguityNoteZh: string | null;
}

function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 40);
}

function validateAnswerIds(challenge: InternalChallenge, input: AttemptInput): void {
  const optionIds = new Set(challenge.options.map((option) => option.id));
  for (const id of [input.firstAnswerId, input.finalAnswerId]) {
    if (id !== null && !optionIds.has(id)) {
      throw new Error('invalid_answer_option');
    }
  }
}

function defaultMemory(challenge: InternalChallenge): FacetMemory {
  return {
    itemId: challenge.itemId,
    facet: challenge.facet,
    target: challenge.target,
    halfLifeHours: 24,
    uncertainty: 1,
    lastEvidenceAt: null,
    cooldownUntil: null,
    immediateUnaidedSuccesses: 0,
    delayedUnaidedSuccesses: 0,
  };
}

export async function submitLearningAttempt(
  input: { userId: string; attempt: AttemptInput; now: Date },
  deps: { repository: LearningRepository; challengeBuilder: ChallengeBuilder; idFactory: LearningIdFactory },
): Promise<{
  feedback: ChallengeFeedback;
  evidence: EvidenceSummary;
  replayed: boolean;
  nextChallenge: null;
  roundComplete: boolean;
}> {
  const parsed = attemptInputSchema.parse(input.attempt);
  const challenge = await deps.repository.getInternalChallenge(input.userId, parsed.challengeId);
  if (challenge === null) {
    throw new Error('challenge_not_found');
  }
  validateAnswerIds(challenge, parsed);

  const correct = parsed.finalAnswerId === challenge.correctOptionId;
  const attempt: AttemptRecord = {
    ...parsed,
    id: stableHash(['learningAttempt', input.userId, challenge.id]),
    sessionId: challenge.sessionId,
    unitId: challenge.unitId,
    itemId: challenge.itemId,
    facet: challenge.facet,
    target: challenge.target,
    stage: challenge.stage,
    contextProvenance: challenge.contextProvenance,
    contextNovelty: challenge.contextNovelty,
    contextFingerprint: challenge.contextFingerprint,
    correct,
    occurredAt: input.now.toISOString(),
    answerHash: stableHash(parsed),
  };
  const prior = await deps.repository.listAttemptEvidenceContext(input.userId, challenge.itemId, challenge.facet);
  const updatedMemory = updateMemory(defaultMemory(challenge), attempt, input.now);
  const transition = await deps.repository.recordAttemptAndAdvance({
    userId: input.userId,
    roundId: challenge.sessionId,
    challenge,
    attempt,
    updatedMemory,
    nextChallenge: null,
    roundComplete: true,
    occurredAt: input.now.toISOString(),
  });
  const validAttempts = [attempt, ...prior.attempts.filter((entry) => !prior.invalidatedAttemptIds.includes(entry.id))];

  return {
    feedback: {
      correctOptionId: challenge.correctOptionId,
      explanationZh: challenge.explanationZh,
      decisiveCluesZh: challenge.decisiveCluesZh,
      optionExplanations: challenge.optionExplanations,
      evidence: challenge.evidence,
      ambiguityNoteZh: challenge.ambiguityNoteZh,
    },
    evidence: summarizeEvidence(validAttempts),
    replayed: transition.replayed,
    nextChallenge: null,
    roundComplete: transition.roundComplete,
  };
}
