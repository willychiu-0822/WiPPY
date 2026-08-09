import type { PublicLearningChallenge } from '../api/types';
import type { ChallengeDraft } from './roundReducer';

export function ChallengeCard({
  challenge,
  draft,
  onChoose,
  onHint,
  onReveal,
  onSkip,
  onSubmit,
  onReport,
  disabled,
}: {
  challenge: PublicLearningChallenge;
  draft: ChallengeDraft;
  onChoose: (optionId: string) => void;
  onHint: () => void;
  onReveal: () => void;
  onSkip: () => void;
  onSubmit: () => void;
  onReport: () => void;
  disabled?: boolean;
}) {
  return (
    <section className="mx-auto max-w-2xl space-y-5 rounded-3xl bg-white p-5 shadow-sm">
      <div className="space-y-3">
        <p className="text-sm text-gray-500">英文辨認練習</p>
        <h1 className="text-xl font-semibold text-gray-950">{challenge.promptZh}</h1>
        <blockquote className="rounded-2xl bg-gray-50 p-4 text-lg leading-8 text-gray-900">{challenge.excerptEn}</blockquote>
        {challenge.recommendedSupport === 'hint_1' ? <p className="text-sm text-blue-700">可以先看提示。</p> : null}
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">選擇答案</legend>
        {challenge.options.map((option) => (
          <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3">
            <input
              type="radio"
              name={challenge.id}
              value={option.id}
              checked={draft.finalAnswerId === option.id}
              onChange={() => onChoose(option.id)}
              disabled={disabled}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </fieldset>

      {draft.shownHints > 0 ? (
        <div className="space-y-2 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
          {challenge.hints.slice(0, draft.shownHints).map((hint) => (
            <p key={hint}>{hint}</p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={disabled} onClick={onSubmit} className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white disabled:bg-blue-300">
          確認答案
        </button>
        <button type="button" disabled={disabled || draft.shownHints >= Math.min(2, challenge.hints.length)} onClick={onHint} className="min-h-11 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800">
          再給我一點提示
        </button>
        <button type="button" disabled={disabled} onClick={onReveal} className="min-h-11 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800">
          直接看答案
        </button>
        <button type="button" disabled={disabled} onClick={onSkip} className="min-h-11 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800">
          跳過
        </button>
        <button type="button" disabled={disabled} onClick={onReport} className="min-h-11 rounded-xl px-4 py-2 font-medium text-gray-500">
          這題有問題
        </button>
      </div>
    </section>
  );
}
