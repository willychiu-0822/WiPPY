import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLearningApi } from '../api/learningApiContextValue';
import type { AttemptResultView, ChallengeReportRequest, ChallengeReportResultView, PublicLearningChallenge } from '../api/types';
import { ChallengeCard } from './ChallengeCard';
import { ChallengeFeedback } from './ChallengeFeedback';
import { ChallengeIssueDialog } from './ChallengeIssueDialog';
import { RoundEvidenceSummary } from './RoundEvidenceSummary';
import { cappedElapsedMs, emptyDraft, showNextHint, updateAnswer, type ChallengeDraft } from './roundReducer';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'answering'; challenge: PublicLearningChallenge; draft: ChallengeDraft; evidence: AttemptResultView['evidence'][] }
  | { kind: 'submitting'; challenge: PublicLearningChallenge; draft: ChallengeDraft; evidence: AttemptResultView['evidence'][] }
  | { kind: 'feedback'; challenge: PublicLearningChallenge; result: AttemptResultView; evidence: AttemptResultView['evidence'][] }
  | { kind: 'issue'; challenge: PublicLearningChallenge; afterAttempt: boolean; evidence: AttemptResultView['evidence'][]; result?: AttemptResultView }
  | { kind: 'reportNotice'; message: string; nextChallenge: PublicLearningChallenge | null; roundComplete: boolean; evidence: AttemptResultView['evidence'][] }
  | { kind: 'complete'; evidence: AttemptResultView['evidence'][] }
  | { kind: 'error'; message: string };

function supportLevel(draft: ChallengeDraft) {
  if (draft.skipped) return 'skip';
  if (draft.answerRevealed) return 'answer';
  if (draft.shownHints === 2) return 'hint_2';
  if (draft.shownHints === 1) return 'hint_1';
  return 'none';
}

export function RoundPage() {
  const api = useLearningApi();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get('sourceId') ?? undefined;
  const [state, setState] = useState<ViewState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void api
        .createRound(sourceId ? { sourceId } : {})
        .then((round) => {
          if (cancelled) return;
          if (!round.challenge) setState({ kind: 'empty' });
          else setState({ kind: 'answering', challenge: round.challenge, draft: emptyDraft(Date.now()), evidence: [] });
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setState({ kind: 'error', message: error instanceof Error ? error.message : '無法開始這一輪' });
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api, sourceId]);

  const submit = useCallback(
    async (mode: 'confirm' | 'answer' | 'skip') => {
      if (state.kind !== 'answering') return;
      const nextDraft: ChallengeDraft =
        mode === 'answer'
          ? { ...state.draft, answerRevealed: true, finalAnswerId: null }
          : mode === 'skip'
            ? { ...state.draft, skipped: true, firstAnswerId: null, finalAnswerId: null }
            : state.draft;
      setState({ kind: 'submitting', challenge: state.challenge, draft: nextDraft, evidence: state.evidence });
      try {
        const result = await api.submitAttempt({
          challengeId: state.challenge.id,
          firstAnswerId: nextDraft.firstAnswerId,
          finalAnswerId: nextDraft.answerRevealed || nextDraft.skipped ? null : nextDraft.finalAnswerId,
          supportLevel: supportLevel(nextDraft),
          answerRevealed: nextDraft.answerRevealed,
          skipped: nextDraft.skipped,
          responseMs: cappedElapsedMs(nextDraft, Date.now()),
        });
        setState({ kind: 'feedback', challenge: state.challenge, result, evidence: [...state.evidence, result.evidence] });
      } catch (error) {
        setState({ kind: 'error', message: error instanceof Error ? error.message : '送出失敗' });
      }
    },
    [api, state],
  );

  const report = useCallback(
    async (challenge: PublicLearningChallenge, input: ChallengeReportRequest, afterAttempt: boolean, evidence: AttemptResultView['evidence'][]) => {
      try {
        const result: ChallengeReportResultView = await api.reportChallenge(challenge.id, input);
        setState({
          kind: 'reportNotice',
          message: afterAttempt
            ? result.evidenceInvalidated
              ? '這次證據已標記為有疑問，不會用來更新記憶模型'
              : '已收到回報；伺服器沒有標記既有證據失效'
            : '已暫停這題，這次不會產生學習證據',
          nextChallenge: result.nextChallenge,
          roundComplete: result.roundComplete,
          evidence,
        });
      } catch (error) {
        setState({ kind: 'error', message: error instanceof Error ? error.message : '回報失敗' });
      }
    },
    [api],
  );

  const content = useMemo(() => {
    if (state.kind === 'loading') return <p className="text-sm text-gray-500">正在準備這一輪…</p>;
    if (state.kind === 'empty') {
      return (
        <section className="mx-auto max-w-2xl rounded-3xl bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-950">目前沒有足夠可靠、適合出題的英文項目</h1>
          <p className="mt-2 text-sm text-gray-600">內容仍會留在知識庫；等有更可靠的語言證據時再出題。</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/learn/knowledge" className="rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800">
              查看知識庫
            </Link>
            <Link to="/learn/sources/new" className="rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800">
              加入另一篇
            </Link>
          </div>
        </section>
      );
    }
    if (state.kind === 'error') return <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{state.message}</p>;
    if (state.kind === 'complete') return <RoundEvidenceSummary evidence={state.evidence} />;
    if (state.kind === 'reportNotice') {
      return (
        <section className="mx-auto max-w-2xl space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <p className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-900">{state.message}</p>
          <button
            type="button"
            onClick={() =>
              state.nextChallenge
                ? setState({ kind: 'answering', challenge: state.nextChallenge, draft: emptyDraft(Date.now()), evidence: state.evidence })
                : setState({ kind: 'complete', evidence: state.evidence })
            }
            className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white"
          >
            {state.nextChallenge || !state.roundComplete ? '繼續' : '完成'}
          </button>
        </section>
      );
    }
    if (state.kind === 'issue') {
      return (
        <ChallengeIssueDialog
          onClose={() =>
            state.result
              ? setState({ kind: 'feedback', challenge: state.challenge, result: state.result, evidence: state.evidence })
              : setState({ kind: 'answering', challenge: state.challenge, draft: emptyDraft(Date.now()), evidence: state.evidence })
          }
          onSubmit={(input) => void report(state.challenge, input, state.afterAttempt, state.evidence)}
        />
      );
    }
    if (state.kind === 'feedback') {
      return (
        <ChallengeFeedback
          challenge={state.challenge}
          result={state.result}
          onReport={() => setState({ kind: 'issue', challenge: state.challenge, afterAttempt: true, evidence: state.evidence, result: state.result })}
          onContinue={() =>
            state.result.nextChallenge
              ? setState({ kind: 'answering', challenge: state.result.nextChallenge, draft: emptyDraft(Date.now()), evidence: state.evidence })
              : setState({ kind: 'complete', evidence: state.evidence })
          }
        />
      );
    }

    return (
      <ChallengeCard
        challenge={state.challenge}
        draft={state.draft}
        disabled={state.kind === 'submitting'}
        onChoose={(optionId) =>
          setState({ kind: 'answering', challenge: state.challenge, draft: updateAnswer(state.draft, optionId), evidence: state.evidence })
        }
        onHint={() =>
          setState({ kind: 'answering', challenge: state.challenge, draft: showNextHint(state.draft, state.challenge.hints.length), evidence: state.evidence })
        }
        onReveal={() => void submit('answer')}
        onSkip={() => void submit('skip')}
        onSubmit={() => void submit('confirm')}
        onReport={() => setState({ kind: 'issue', challenge: state.challenge, afterAttempt: false, evidence: state.evidence })}
      />
    );
  }, [report, state, submit]);

  return <div className="space-y-4">{content}</div>;
}
