import type { ChallengeIssue } from '../domain/model';
import type { ChallengeBuilder, LearningRepository } from './ports';
import type { LearningIdFactory } from './learningIds';

export async function reportChallengeIssue(
  input: { userId: string; challengeId: string; issue: ChallengeIssue; detail: string | null; now: Date },
  deps: { repository: LearningRepository; challengeBuilder: ChallengeBuilder; idFactory: LearningIdFactory },
): Promise<{ suspended: true; evidenceInvalidated: boolean; nextChallenge: null; roundComplete: boolean }> {
  const challenge = await deps.repository.getInternalChallenge(input.userId, input.challengeId);
  if (challenge === null) throw new Error('challenge_not_found');
  const transition = await deps.repository.suspendChallengeReportAndAdvance({
    userId: input.userId,
    roundId: challenge.sessionId,
    challenge,
    issue: input.issue,
    detail: input.detail,
    invalidatedAttemptId: null,
    nextChallenge: null,
    roundComplete: true,
    occurredAt: input.now.toISOString(),
  });
  return { suspended: true, evidenceInvalidated: false, nextChallenge: null, roundComplete: transition.roundComplete };
}
