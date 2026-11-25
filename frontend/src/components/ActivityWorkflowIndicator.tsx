import { ACTIVITY_WORKFLOW_STEPS, type ActivityWorkflowPrimary, type ActivityWorkflowStep } from './activityWorkflow';

const STEP_ORDER: Record<ActivityWorkflowStep, number> = { approve: 0, confirm: 1, send: 2 };

const DETACHED_LABEL: Record<Exclude<ActivityWorkflowPrimary, 'approve'>, string> = {
  plan: '請 AI 規劃第一份推播',
  confirm: '✅ 討論好了，確認排程',
  send: '送出',
};

interface Props {
  step: ActivityWorkflowStep;
  /** Set when the solid action lives on the Agent tab and that tab is closed. Clicking opens it. */
  detachedPrimary?: Exclude<ActivityWorkflowPrimary, 'approve'> | null;
  onOpenAgent?: () => void;
}

export default function ActivityWorkflowIndicator({ step, detachedPrimary = null, onOpenAgent }: Props) {
  const current = STEP_ORDER[step];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 space-y-2">
      <nav aria-label="活動流程">
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
          {ACTIVITY_WORKFLOW_STEPS.map((item, index) => {
            const position = STEP_ORDER[item.id];
            const state = position < current ? 'done' : position === current ? 'current' : 'upcoming';
            return (
              <li key={item.id} className="flex items-center gap-1">
                {index > 0 && <span aria-hidden="true" className="text-gray-300">→</span>}
                <span
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={
                    state === 'current'
                      ? 'font-semibold text-blue-800 bg-blue-50 rounded-full px-2 py-0.5'
                      : state === 'done'
                        ? 'text-gray-500 px-1'
                        : 'text-gray-400 px-1'
                  }
                >
                  {index + 1} {item.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
      {detachedPrimary && (
        <button
          type="button"
          data-primary="true"
          onClick={onOpenAgent}
          className={`w-full text-sm text-white rounded-xl px-4 py-2 font-medium ${
            detachedPrimary === 'confirm'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {DETACHED_LABEL[detachedPrimary]}
        </button>
      )}
    </div>
  );
}
