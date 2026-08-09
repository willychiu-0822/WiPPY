import type { AttemptResultView, PublicLearningChallenge } from '../api/types';

export function ChallengeFeedback({
  challenge,
  result,
  onContinue,
  onReport,
}: {
  challenge: PublicLearningChallenge;
  result: AttemptResultView;
  onContinue: () => void;
  onReport: () => void;
}) {
  const correct = challenge.options.find((option) => option.id === result.feedback.correctOptionId);

  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-3xl bg-white p-5 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-950">這題的語言證據</h1>
      {correct ? <p className="rounded-2xl bg-green-50 p-3 text-sm text-green-900">正解：{correct.text}</p> : null}
      <p className="text-gray-800">{result.feedback.explanationZh}</p>
      <div>
        <h2 className="font-medium text-gray-900">決定性線索</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {result.feedback.decisiveCluesZh.map((clue) => (
            <li key={clue}>{clue}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="font-medium text-gray-900">每個選項為什麼合適或不合適</h2>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {result.feedback.optionExplanations.map((option) => (
            <li key={option.optionId}>{option.explanationZh}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="font-medium text-gray-900">來源證據</h2>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {result.feedback.evidence.map((evidence) => (
            <li key={`${evidence.sourceName}-${evidence.locator}`}>
              {evidence.sourceName} · {evidence.locator}
            </li>
          ))}
        </ul>
      </div>
      {result.feedback.ambiguityNoteZh ? <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">{result.feedback.ambiguityNoteZh}</p> : null}
      <p className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-900">{result.evidence.headline}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onContinue} className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white">
          {result.nextChallenge ? '繼續' : '完成'}
        </button>
        <button type="button" onClick={onReport} className="min-h-11 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800">
          這題有問題
        </button>
      </div>
    </section>
  );
}
