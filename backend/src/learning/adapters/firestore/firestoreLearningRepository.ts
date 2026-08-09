import type { Firestore } from 'firebase-admin/firestore';
import type {
  CaptureBatchInput,
  ClaimedLearningRun,
  ClaimRunEnqueueInput,
  ClaimRunInput,
  CompleteRunInput,
  CreateSourceInput,
  FailRunInput,
  FinishRunEnqueueInput,
  KnowledgeRecordPage,
  LearningRepository,
  LearningRunView,
  LearningSourceView,
  ReportTransitionInput,
  RoundStateView,
  RoundTransitionResult,
  SaveRoundInput,
  SourceSegmentView,
  AttemptTransitionInput,
} from '../../application/ports';
import type {
  AttemptRecord,
  Facet,
  FacetMemory,
  InternalChallenge,
  KnowledgeItem,
  SourceContextRef,
} from '../../domain/model';
import type { SelectionCandidate } from '../../domain/selection/types';
import { facetStateId, runId, segmentId, sourceId, sourceVersionId, stableId } from './ids';
import { learningCollections, learningSchemaVersion } from './documents';

type StoredSource = {
  schemaVersion: 1;
  id: string;
  userId: string;
  title: string;
  author: string | null;
  url: string | null;
  objective: string | null;
  status: 'processing' | 'completed' | 'failed';
  verifiedItemCount: number;
  requestId: string;
  payloadHash: string;
  createdAt: string;
  updatedAt: string;
};

type StoredRun = {
  schemaVersion: 1;
  id: string;
  userId: string;
  sourceId: string;
  sourceVersionId: string;
  status: LearningRunView['status'];
  capturedItemCount: number;
  verifiedItemCount: number;
  safeErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
  nextEnqueueAt: string;
  workerId?: string;
  leaseUntil?: string;
};

type StoredSegment = {
  schemaVersion: 1;
  id: string;
  userId: string;
  sourceId: string;
  sourceVersionId: string;
  ordinal: number;
  text: string;
  createdAt: string;
};

function payloadHash(input: CreateSourceInput): string {
  return stableId(
    input.title,
    input.author ?? '',
    input.url ?? '',
    input.objective ?? '',
    JSON.stringify(input.segments.map((segment) => [segment.ordinal, segment.text])),
  );
}

function terminalRunExpiresAt(atIso: string): string {
  return new Date(new Date(atIso).getTime() + 30 * 24 * 3_600_000).toISOString();
}

function roundExpiresAt(atIso: string): string {
  return new Date(new Date(atIso).getTime() + 90 * 24 * 3_600_000).toISOString();
}

export class FirestoreLearningRepository implements LearningRepository {
  constructor(private readonly db: Firestore) {}

  async hasLearningAccess(userId: string): Promise<boolean> {
    const snap = await this.db.collection(learningCollections.access).doc(userId).get();
    if (!snap.exists) return false;
    const data = snap.data() as { userId?: string; enabled?: boolean };
    return data.userId === userId && data.enabled === true;
  }

  async createSourceAndRun(input: CreateSourceInput): Promise<{ sourceId: string; sourceVersionId: string; runId: string }> {
    const source = sourceId(input.userId, input.requestId);
    const version = sourceVersionId(source, input.requestId);
    const run = runId(version);
    const hash = payloadHash(input);
    const sourceRef = this.db.collection(learningCollections.sources).doc(source);
    const versionRef = this.db.collection(learningCollections.sourceVersions).doc(version);
    const runRef = this.db.collection(learningCollections.runs).doc(run);

    await this.db.runTransaction(async (tx) => {
      const existing = await tx.get(sourceRef);
      if (existing.exists) {
        const data = existing.data() as StoredSource;
        if (data.userId !== input.userId || data.payloadHash !== hash) {
          throw new Error('source_request_conflict');
        }
        return;
      }

      const sourceDoc: StoredSource = {
        schemaVersion: learningSchemaVersion,
        id: source,
        userId: input.userId,
        title: input.title,
        author: input.author,
        url: input.url,
        objective: input.objective,
        status: 'processing',
        verifiedItemCount: 0,
        requestId: input.requestId,
        payloadHash: hash,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      };
      tx.set(sourceRef, sourceDoc);
      tx.set(versionRef, {
        schemaVersion: learningSchemaVersion,
        id: version,
        userId: input.userId,
        sourceId: source,
        status: 'processing',
        captureStatus: 'pending',
        verifiedItemCount: 0,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      });
      for (const segment of input.segments) {
        const id = segmentId(version, segment.ordinal, segment.text);
        const segmentDoc: StoredSegment = {
          schemaVersion: learningSchemaVersion,
          id,
          userId: input.userId,
          sourceId: source,
          sourceVersionId: version,
          ordinal: segment.ordinal,
          text: segment.text,
          createdAt: input.createdAt,
        };
        tx.set(this.db.collection(learningCollections.segments).doc(id), segmentDoc);
      }
      const runDoc: StoredRun = {
        schemaVersion: learningSchemaVersion,
        id: run,
        userId: input.userId,
        sourceId: source,
        sourceVersionId: version,
        status: 'pending_enqueue',
        capturedItemCount: 0,
        verifiedItemCount: 0,
        safeErrorCode: null,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
        nextEnqueueAt: input.createdAt,
      };
      tx.set(runRef, runDoc);
    });

    return { sourceId: source, sourceVersionId: version, runId: run };
  }

  async getSource(userId: string, sourceIdValue: string): Promise<LearningSourceView | null> {
    const sourceSnap = await this.db.collection(learningCollections.sources).doc(sourceIdValue).get();
    if (!sourceSnap.exists) return null;
    const source = sourceSnap.data() as StoredSource;
    if (source.userId !== userId) return null;
    const segments = await this.db
      .collection(learningCollections.segments)
      .where('userId', '==', userId)
      .where('sourceId', '==', sourceIdValue)
      .orderBy('ordinal', 'asc')
      .get();

    return {
      id: source.id,
      userId: source.userId,
      title: source.title,
      author: source.author,
      url: source.url,
      objective: source.objective,
      status: source.status,
      verifiedItemCount: source.verifiedItemCount,
      segments: segments.docs.map((doc) => {
        const data = doc.data() as StoredSegment;
        return { id: data.id, ordinal: data.ordinal, text: data.text };
      }),
      createdAt: source.createdAt,
    };
  }

  async getSourceSpan(userId: string, input: { segmentId: string; startOffset: number; endOffset: number }): Promise<string | null> {
    const snap = await this.db.collection(learningCollections.segments).doc(input.segmentId).get();
    if (!snap.exists) return null;
    const data = snap.data() as StoredSegment;
    if (data.userId !== userId) return null;
    if (input.startOffset < 0 || input.endOffset > data.text.length || input.startOffset >= input.endOffset) {
      return null;
    }
    return data.text.slice(input.startOffset, input.endOffset);
  }

  async findChallengeContext(userId: string, input: {
    itemId: string;
    sourceId: string | null;
    provenance: 'source' | 'scheduled_authentic';
    excludedFingerprints: string[];
  }): Promise<SourceContextRef | null> {
    let query = this.db
      .collection(learningCollections.occurrences)
      .where('userId', '==', userId)
      .where('published', '==', true)
      .where('itemIds', 'array-contains', input.itemId);
    if (input.sourceId !== null) {
      query = query.where('sourceId', '==', input.sourceId);
    }
    const snap = await query.limit(20).get();
    for (const doc of snap.docs) {
      const data = doc.data() as {
        sourceId: string;
        sourceVersionId: string;
        segmentId: string;
        startOffset: number;
        endOffset: number;
        contextFingerprint: string;
        contextQuality: number;
        contextNovelty: number;
      };
      if (input.excludedFingerprints.includes(data.contextFingerprint) || data.contextQuality < 0.7) {
        continue;
      }
      return { provenance: input.provenance, ...data };
    }
    return null;
  }

  async getRun(userId: string, runIdValue: string): Promise<LearningRunView | null> {
    const snap = await this.db.collection(learningCollections.runs).doc(runIdValue).get();
    if (!snap.exists) return null;
    const run = snap.data() as StoredRun;
    if (run.userId !== userId) return null;
    return {
      id: run.id,
      sourceId: run.sourceId,
      status: run.status,
      capturedItemCount: run.capturedItemCount,
      verifiedItemCount: run.verifiedItemCount,
      safeErrorCode: run.safeErrorCode,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }

  async listRunsNeedingEnqueue(nowIso: string, limit: number): Promise<Array<{ userId: string; runId: string }>> {
    const snap = await this.db
      .collection(learningCollections.runs)
      .where('status', 'in', ['pending_enqueue', 'retryable'])
      .where('nextEnqueueAt', '<=', nowIso)
      .orderBy('nextEnqueueAt', 'asc')
      .limit(limit)
      .get();
    return snap.docs.map((doc) => {
      const data = doc.data() as StoredRun;
      return { userId: data.userId, runId: data.id };
    });
  }

  async claimRunEnqueue(input: ClaimRunEnqueueInput): Promise<'claimed' | 'already_active' | 'completed'> {
    const ref = this.db.collection(learningCollections.runs).doc(input.runId);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return 'already_active';
      const run = snap.data() as StoredRun;
      if (run.userId !== input.userId) return 'already_active';
      if (run.status === 'completed') return 'completed';
      if (run.status !== 'pending_enqueue' && run.status !== 'retryable') return 'already_active';
      tx.update(ref, {
        status: 'queued',
        workerId: input.workerId,
        leaseUntil: input.leaseUntil,
        updatedAt: input.claimedAt,
      });
      return 'claimed';
    });
  }

  async finishRunEnqueue(input: FinishRunEnqueueInput): Promise<void> {
    const ref = this.db.collection(learningCollections.runs).doc(input.runId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;
      const run = snap.data() as StoredRun;
      if (run.userId !== input.userId || run.workerId !== input.workerId) return;
      if (run.status === 'running' || run.status === 'publishing' || run.status === 'completed') return;
      tx.update(ref, {
        status: input.accepted ? 'queued' : 'retryable',
        updatedAt: input.finishedAt,
      });
    });
  }

  async claimRun(input: ClaimRunInput): Promise<ClaimedLearningRun | null> {
    const ref = this.db.collection(learningCollections.runs).doc(input.runId);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const run = snap.data() as StoredRun;
      if (run.userId !== input.userId) return null;
      const leaseExpired = !run.leaseUntil || new Date(run.leaseUntil).getTime() <= new Date(input.claimedAt).getTime();
      if (!['queued', 'retryable', 'pending_enqueue', 'running', 'publishing'].includes(run.status)) return null;
      if ((run.status === 'running' || run.status === 'publishing') && !leaseExpired) return null;
      tx.update(ref, {
        status: 'running',
        workerId: input.workerId,
        leaseUntil: input.leaseUntil,
        updatedAt: input.claimedAt,
      });
      return {
        userId: run.userId,
        runId: run.id,
        sourceId: run.sourceId,
        sourceVersionId: run.sourceVersionId,
      };
    });
  }

  async listSourceSegments(userId: string, sourceVersionIdValue: string): Promise<SourceSegmentView[]> {
    const snap = await this.db
      .collection(learningCollections.segments)
      .where('userId', '==', userId)
      .where('sourceVersionId', '==', sourceVersionIdValue)
      .orderBy('ordinal', 'asc')
      .get();
    return snap.docs.map((doc) => {
      const data = doc.data() as StoredSegment;
      return { id: data.id, ordinal: data.ordinal, text: data.text };
    });
  }

  async saveCaptureBatch(input: CaptureBatchInput): Promise<void> {
    const batchRef = this.db.collection(learningCollections.ingestionBatches).doc(input.batchId);
    await this.db.runTransaction(async (tx) => {
      const marker = await tx.get(batchRef);
      if (marker.exists) return;

      const itemReads = await Promise.all(
        input.units.map(async (unit) => ({
          unit,
          ref: this.db.collection(learningCollections.items).doc(unit.item.id),
          snap: await tx.get(this.db.collection(learningCollections.items).doc(unit.item.id)),
        })),
      );
      const occurrenceReads = await Promise.all(
        input.units.map(async (unit) => ({
          unit,
          ref: this.db.collection(learningCollections.occurrences).doc(unit.occurrence.id),
          snap: await tx.get(this.db.collection(learningCollections.occurrences).doc(unit.occurrence.id)),
        })),
      );
      const segmentReads = await Promise.all(
        input.units.map(async (unit) => ({
          occurrenceId: unit.occurrence.id,
          snap: await tx.get(this.db.collection(learningCollections.segments).doc(unit.occurrence.segmentId)),
        })),
      );
      const segmentByOccurrenceId = new Map(
        segmentReads.map((read) => [read.occurrenceId, read.snap]),
      );
      const stateReads = await Promise.all(
        input.facetStates.map(async (state) => ({
          state,
          ref: this.db.collection(learningCollections.facetStates).doc(facetStateId(input.userId, state.itemId, state.facet, state.target)),
          snap: await tx.get(this.db.collection(learningCollections.facetStates).doc(facetStateId(input.userId, state.itemId, state.facet, state.target))),
        })),
      );

      tx.set(batchRef, {
        schemaVersion: learningSchemaVersion,
        id: input.batchId,
        userId: input.userId,
        runId: input.runId,
        createdAt: input.capturedAt,
      });

      for (const { unit, ref: itemRef, snap: itemSnap } of itemReads) {
        if (!itemSnap.exists) {
          tx.set(itemRef, {
            schemaVersion: learningSchemaVersion,
            userId: input.userId,
            published: false,
            updatedAt: input.capturedAt,
            ...unit.item,
          });
        } else {
          tx.update(itemRef, {
            updatedAt: input.capturedAt,
            excludedByUser: (itemSnap.data() as KnowledgeItem).excludedByUser ?? unit.item.excludedByUser,
          });
        }
      }

      for (const { unit, ref: occurrenceRef, snap: occurrenceSnap } of occurrenceReads) {
        const segment = segmentByOccurrenceId.get(unit.occurrence.id);
        const existingItemIds = occurrenceSnap.exists ? ((occurrenceSnap.data()?.['itemIds'] as string[] | undefined) ?? []) : [];
        const itemIds = Array.from(new Set([...existingItemIds, unit.link.itemId]));
        const segmentData = segment?.data() as StoredSegment | undefined;
        const text = segmentData?.text ?? '';
        tx.set(
          occurrenceRef,
          {
            schemaVersion: learningSchemaVersion,
            userId: input.userId,
            sourceId: input.sourceId,
            sourceVersionId: input.sourceVersionId,
            published: false,
            itemIds,
            contextFingerprint: stableId(input.sourceVersionId, unit.occurrence.segmentId, String(unit.occurrence.startOffset), String(unit.occurrence.endOffset), text),
            contextQuality: 1,
            contextNovelty: 1,
            ...unit.occurrence,
          },
          { merge: true },
        );
      }

      for (const unit of input.units) {
        const sourceItemRef = this.db.collection(learningCollections.sourceItems).doc(stableId(input.sourceVersionId, unit.item.id));
        tx.set(
          sourceItemRef,
          {
            schemaVersion: learningSchemaVersion,
            userId: input.userId,
            sourceId: input.sourceId,
            sourceVersionId: input.sourceVersionId,
            itemId: unit.item.id,
            qualityStatus: unit.item.qualityStatus,
            published: false,
            capturedAt: input.capturedAt,
          },
          { merge: true },
        );
      }

      for (const { state, ref: stateRef, snap: stateSnap } of stateReads) {
        if (!stateSnap.exists) {
          tx.set(stateRef, {
            schemaVersion: learningSchemaVersion,
            userId: input.userId,
            published: false,
            nextCandidateAt: input.capturedAt,
            ...state,
          });
        }
      }
    });
  }

  async completeRun(input: CompleteRunInput): Promise<void> {
    const expiresAt = terminalRunExpiresAt(input.completedAt);
    await this.db.runTransaction(async (tx) => {
      tx.update(this.db.collection(learningCollections.runs).doc(input.runId), {
        status: 'completed',
        capturedItemCount: input.capturedItemCount,
        verifiedItemCount: input.verifiedItemCount,
        updatedAt: input.completedAt,
        expiresAt,
      });
      tx.update(this.db.collection(learningCollections.sources).doc(input.sourceId), {
        status: 'completed',
        verifiedItemCount: input.verifiedItemCount,
        updatedAt: input.completedAt,
      });
      tx.update(this.db.collection(learningCollections.sourceVersions).doc(input.sourceVersionId), {
        status: 'completed',
        captureStatus: 'completed',
        verifiedItemCount: input.verifiedItemCount,
        updatedAt: input.completedAt,
      });
    });
  }

  async failRun(input: FailRunInput): Promise<void> {
    await this.db.collection(learningCollections.runs).doc(input.runId).update({
      status: 'failed',
      safeErrorCode: input.safeErrorCode,
      updatedAt: input.failedAt,
      expiresAt: terminalRunExpiresAt(input.failedAt),
    });
  }

  async listSelectionCandidates(): Promise<SelectionCandidate[]> {
    return [];
  }

  async getKnowledgeItem(userId: string, itemId: string): Promise<KnowledgeItem | null> {
    const snap = await this.db.collection(learningCollections.items).doc(itemId).get();
    if (!snap.exists) return null;
    const data = snap.data() as KnowledgeItem & { userId: string };
    if (data.userId !== userId) return null;
    return data;
  }

  async saveRound(input: SaveRoundInput): Promise<{ roundId: string; firstChallengeId: string | null }> {
    for (const unit of input.units) {
      if (unit.sessionId !== input.roundId) {
        throw new Error('round_session_mismatch');
      }
    }
    if (input.firstChallenge !== null && input.firstChallenge.sessionId !== input.roundId) {
      throw new Error('round_session_mismatch');
    }
    const expiresAt = roundExpiresAt(input.createdAt);
    const batch = this.db.batch();
    batch.set(this.db.collection(learningCollections.sessions).doc(input.roundId), {
      schemaVersion: learningSchemaVersion,
      id: input.roundId,
      userId: input.userId,
      status: input.firstChallenge === null ? 'completed' : 'active',
      currentChallengeId: input.firstChallenge?.id ?? null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      expiresAt,
    });
    for (const unit of input.units) {
      batch.set(this.db.collection(learningCollections.roundUnits).doc(unit.id), {
        schemaVersion: learningSchemaVersion,
        userId: input.userId,
        expiresAt,
        ...unit,
      });
    }
    if (input.firstChallenge !== null) {
      batch.set(this.db.collection(learningCollections.challenges).doc(input.firstChallenge.id), {
        schemaVersion: learningSchemaVersion,
        userId: input.userId,
        expiresAt,
        ...input.firstChallenge,
      });
    }
    await batch.commit();
    return { roundId: input.roundId, firstChallengeId: input.firstChallenge?.id ?? null };
  }

  async getRoundState(userId: string, roundIdValue: string): Promise<RoundStateView | null> {
    const snap = await this.db.collection(learningCollections.sessions).doc(roundIdValue).get();
    if (!snap.exists) return null;
    const data = snap.data() as RoundStateView;
    if (data.userId !== userId) return null;
    return data;
  }

  async getInternalChallenge(userId: string, challengeId: string): Promise<InternalChallenge | null> {
    const snap = await this.db.collection(learningCollections.challenges).doc(challengeId).get();
    if (!snap.exists) return null;
    const data = snap.data() as InternalChallenge & { userId: string };
    if (data.userId !== userId) return null;
    return data;
  }

  async listAttemptEvidenceContext(userId: string, itemId: string, facet: Facet): Promise<{ attempts: AttemptRecord[]; invalidatedAttemptIds: string[] }> {
    const attempts = await this.db
      .collection(learningCollections.attempts)
      .where('userId', '==', userId)
      .where('itemId', '==', itemId)
      .where('facet', '==', facet)
      .get();
    const reports = await this.db
      .collection(learningCollections.challengeReports)
      .where('userId', '==', userId)
      .where('itemId', '==', itemId)
      .where('facet', '==', facet)
      .get();
    return {
      attempts: attempts.docs.map((doc) => doc.data() as AttemptRecord),
      invalidatedAttemptIds: reports.docs
        .map((doc) => doc.data()['invalidatedAttemptId'] as string | null | undefined)
        .filter((id): id is string => typeof id === 'string'),
    };
  }

  async recordAttemptAndAdvance(input: AttemptTransitionInput): Promise<RoundTransitionResult> {
    const attemptRef = this.db.collection(learningCollections.attempts).doc(input.attempt.id);
    return this.db.runTransaction(async (tx) => {
      const existing = await tx.get(attemptRef);
      if (existing.exists) {
        const data = existing.data() as AttemptRecord & { transition?: RoundTransitionResult };
        if (data.answerHash !== input.attempt.answerHash) {
          throw new Error('attempt_id_conflict');
        }
        return data.transition ?? { replayed: true, nextChallengeId: input.nextChallenge?.id ?? null, roundComplete: input.roundComplete };
      }
      const transition = { replayed: false, nextChallengeId: input.nextChallenge?.id ?? null, roundComplete: input.roundComplete };
      tx.set(attemptRef, { schemaVersion: learningSchemaVersion, userId: input.userId, ...input.attempt, transition });
      tx.set(
        this.db.collection(learningCollections.facetStates).doc(facetStateId(input.userId, input.updatedMemory.itemId, input.updatedMemory.facet, input.updatedMemory.target)),
        { schemaVersion: learningSchemaVersion, userId: input.userId, published: true, ...input.updatedMemory },
        { merge: true },
      );
      tx.update(this.db.collection(learningCollections.challenges).doc(input.challenge.id), { status: 'answered' });
      if (input.nextChallenge !== null) {
        tx.set(this.db.collection(learningCollections.challenges).doc(input.nextChallenge.id), {
          schemaVersion: learningSchemaVersion,
          userId: input.userId,
          ...input.nextChallenge,
        });
      }
      tx.update(this.db.collection(learningCollections.sessions).doc(input.roundId), {
        status: input.roundComplete ? 'completed' : 'active',
        currentChallengeId: input.nextChallenge?.id ?? null,
        updatedAt: input.occurredAt,
      });
      return transition;
    });
  }

  async suspendChallengeReportAndAdvance(input: ReportTransitionInput): Promise<RoundTransitionResult> {
    const reportId = stableId('learningChallengeReport', input.userId, input.challenge.id, input.invalidatedAttemptId ?? 'pre-submit');
    await this.db.collection(learningCollections.challengeReports).doc(reportId).set({
      schemaVersion: learningSchemaVersion,
      id: reportId,
      userId: input.userId,
      roundId: input.roundId,
      challengeId: input.challenge.id,
      itemId: input.challenge.itemId,
      facet: input.challenge.facet,
      target: input.challenge.target,
      issue: input.issue,
      detail: input.detail,
      invalidatedAttemptId: input.invalidatedAttemptId,
      createdAt: input.occurredAt,
    });
    await this.db.collection(learningCollections.challenges).doc(input.challenge.id).set({ status: 'suspended' }, { merge: true });
    return { replayed: false, nextChallengeId: input.nextChallenge?.id ?? null, roundComplete: input.roundComplete };
  }

  async listKnowledgeRecords(userId: string, input: { limit: number; cursor: string | null }): Promise<KnowledgeRecordPage> {
    let query = this.db.collection(learningCollections.items).where('userId', '==', userId).orderBy('updatedAt', 'desc').limit(input.limit);
    if (input.cursor !== null) {
      const cursor = await this.db.collection(learningCollections.items).doc(input.cursor).get();
      if (cursor.exists) query = query.startAfter(cursor);
    }
    const snap = await query.get();
    return {
      items: snap.docs.map((doc) => doc.data() as KnowledgeItem),
      nextCursor: snap.docs.length === input.limit ? snap.docs[snap.docs.length - 1]!.id : null,
    };
  }

  async setExcludedByUser(userId: string, itemId: string, excluded: boolean): Promise<boolean> {
    const ref = this.db.collection(learningCollections.items).doc(itemId);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.['userId'] !== userId) return false;
    await ref.update({ excludedByUser: excluded });
    return true;
  }
}
