import type { ChallengeReportRequest } from '../api/types';

const issues: Array<{ issue: ChallengeReportRequest['issue']; label: string }> = [
  { issue: 'ambiguous', label: '題意有歧義' },
  { issue: 'wrong_evidence', label: '語言證據可能有誤' },
  { issue: 'other', label: '其他' },
];

export function ChallengeIssueDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: ChallengeReportRequest) => void;
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-950">這題哪裡怪怪的？</h2>
      <p className="mt-1 text-sm text-gray-600">回報只會讓這題暫停，不會把它算成答錯。</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {issues.map((issue) => (
          <button
            key={issue.issue}
            type="button"
            onClick={() => onSubmit({ issue: issue.issue, detail: undefined })}
            className="min-h-11 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800"
          >
            {issue.label}
          </button>
        ))}
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 py-2 font-medium text-gray-500">
          關閉
        </button>
      </div>
    </section>
  );
}
