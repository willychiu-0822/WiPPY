import { renderRunDump } from '../scripts/dumpRun';
import type { HarnessRun, TraceEvent, TraceEventType } from '../types';

const run = {
  status: 'failed',
  intentType: 'plan_messages',
  activityId: 'act_1',
  userId: 'user_1',
  sessionId: 'sess_1',
} as unknown as HarnessRun;

const ttl = { seconds: 0, nanoseconds: 0 } as unknown as import('firebase-admin/firestore').Timestamp;

function ev(
  seq: number,
  type: TraceEventType,
  stage: string,
  timestampMs: number,
  payload: Record<string, unknown>,
  durationMs?: number,
): TraceEvent {
  return { seq, type, stage: stage as TraceEvent['stage'], timestampMs, durationMs, payload, ttlExpiry: ttl };
}

const events: TraceEvent[] = [
  ev(0, 'stage_enter', 'run_planner', 1_000, {}),
  ev(
    1,
    'llm_call',
    'run_planner',
    1_000,
    {
      input: [
        { role: 'system', content: 'SYSTEM_PROMPT_MARKER' },
        { role: 'user', content: 'hi' },
      ],
      output: 'RAW_OUTPUT_MARKER',
      inputMessageCount: 2,
      outputLength: 16,
    },
    2_400,
  ),
  ev(2, 'stage_exit', 'run_planner', 3_400, {}, 2_400),
  ev(3, 'validation', 'validate_output', 3_410, { valid: false, feedback: 'sequenceOrder 重複' }),
  ev(4, 'error', 'validate_output', 3_500, { message: 'repair_failed: bad', stack: 'Error: repair_failed\n  at somewhere' }),
];

describe('renderRunDump', () => {
  const md = renderRunDump('run_1', run, events);

  it('includes a header with status, intent and llm call count', () => {
    expect(md).toContain('# Run run_1  [failed]  intent=plan_messages');
    expect(md).toContain('activity=act_1 user=user_1 session=sess_1');
    expect(md).toContain('llmCalls=1');
  });

  it('renders a timeline with durations, validation and error lines', () => {
    expect(md).toContain('## Timeline');
    expect(md).toContain('run_planner → LLM call #1 (2400ms');
    expect(md).toContain('run_planner ■ exit (2400ms)');
    expect(md).toContain('validate: FAILED — sequenceOrder 重複');
    expect(md).toContain('✖ ERROR: repair_failed: bad');
  });

  it('reproduces the full LLM input and raw output verbatim', () => {
    expect(md).toContain('## LLM Call #1');
    expect(md).toContain('SYSTEM_PROMPT_MARKER');
    expect(md).toContain('RAW_OUTPUT_MARKER');
  });

  it('includes an error section with the stack', () => {
    expect(md).toContain('## Error');
    expect(md).toContain('repair_failed: bad');
    expect(md).toContain('at somewhere');
  });
});
