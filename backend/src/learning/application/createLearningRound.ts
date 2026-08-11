import type { ChallengeBuilder, LearningRepository } from './ports';
import type { LearningIdFactory } from './learningIds';
import type { ChallengeBlueprint, InternalChallenge, RoundUnit, SourceContextRef } from '../domain/model';
import { selectRoundUnits } from '../domain/selection/selectRound';
import { toPublicChallenge } from '../domain/validation';

function internalChallengeFromBlueprint(input: {
  id: string;
  roundId: string;
  unitId: string;
  itemId: string;
  blueprint: ChallengeBlueprint;
  isOldItem: boolean;
}): InternalChallenge {
  return {
    id: input.id,
    sessionId: input.roundId,
    unitId: input.unitId,
    itemId: input.itemId,
    status: 'active',
    isOldItem: input.isOldItem,
    ...input.blueprint,
  };
}

async function buildBlueprint(input: {
  userId: string;
  sourceId: string | null;
  itemId: string;
  candidate: ReturnType<typeof selectRoundUnits>[number]['initialCandidate'];
  repository: LearningRepository;
  challengeBuilder: ChallengeBuilder;
}): Promise<ChallengeBlueprint | null> {
  const item = await input.repository.getKnowledgeItem(input.userId, input.itemId);
  if (!item || item.qualityStatus !== 'verified' || item.excludedByUser) return null;

  let sourceContext: SourceContextRef | null = null;
  if (input.candidate.memory.target === 'source_recognition') {
    sourceContext = await input.repository.findChallengeContext(input.userId, {
      itemId: input.itemId,
      sourceId: input.sourceId,
      provenance: 'source',
      excludedFingerprints: [],
    });
    if (sourceContext === null) return null;
  } else {
    sourceContext = await input.repository.findChallengeContext(input.userId, {
      itemId: input.itemId,
      sourceId: null,
      provenance: 'scheduled_authentic',
      excludedFingerprints: [],
    });
  }

  return input.challengeBuilder.build({
    item,
    facet: input.candidate.facet,
    target: input.candidate.memory.target,
    stage: input.candidate.memory.target === 'source_recognition' ? 'immediate_source' : 'immediate_novel',
    recommendedSupport: input.candidate.memory.lastEvidenceAt === null ? 'none' : 'hint_1',
    excludedContextFingerprints: [],
    sourceContext,
  });
}

export async function createLearningRound(
  input: { userId: string; sourceId: string | null; now: Date },
  deps: { repository: LearningRepository; challengeBuilder: ChallengeBuilder; idFactory: LearningIdFactory },
): Promise<{ roundId: string; challenge: ReturnType<typeof toPublicChallenge> | null; roundComplete: boolean }> {
  const candidates = await deps.repository.listSelectionCandidates(input.userId, {
    nowIso: input.now.toISOString(),
    limit: 100,
    currentSourceId: input.sourceId,
  });
  const selected = selectRoundUnits(candidates, { currentSourceId: input.sourceId }, input.now);
  const roundId = deps.idFactory.create('round');
  const units: RoundUnit[] = [];

  for (const selectedUnit of selected) {
    const blueprint = await buildBlueprint({
      userId: input.userId,
      sourceId: input.sourceId,
      itemId: selectedUnit.itemId,
      candidate: selectedUnit.initialCandidate,
      repository: deps.repository,
      challengeBuilder: deps.challengeBuilder,
    });
    if (blueprint === null) continue;
    units.push({
      id: deps.idFactory.create('unit'),
      sessionId: roundId,
      itemId: selectedUnit.itemId,
      role: selectedUnit.role,
      nextStepPolicy: selectedUnit.nextStepPolicy,
      status: units.length === 0 ? 'active' : 'pending',
      attemptedFacets: [],
      stepCount: 0,
      maxSteps: selectedUnit.maxSteps,
      initialPlan: blueprint,
    });
  }

  const firstUnit = units[0] ?? null;
  const firstChallenge =
    firstUnit === null
      ? null
      : internalChallengeFromBlueprint({
          id: deps.idFactory.create('challenge'),
          roundId,
          unitId: firstUnit.id,
          itemId: firstUnit.itemId,
          blueprint: firstUnit.initialPlan,
          isOldItem: selected.find((unit) => unit.itemId === firstUnit.itemId)?.initialCandidate.attemptCount !== 0,
        });

  await deps.repository.saveRound({
    userId: input.userId,
    roundId,
    createdAt: input.now.toISOString(),
    units,
    firstChallenge,
  });

  if (firstChallenge === null) {
    return { roundId, challenge: null, roundComplete: true };
  }

  const excerpt =
    firstChallenge.contextProvenance === 'synthetic'
      ? firstChallenge.excerptEn
      : (await deps.repository.getSourceSpan(input.userId, {
          segmentId: firstChallenge.segmentId,
          startOffset: firstChallenge.startOffset,
          endOffset: firstChallenge.endOffset,
        })) ?? '';

  return { roundId, challenge: toPublicChallenge(firstChallenge, excerpt), roundComplete: false };
}
