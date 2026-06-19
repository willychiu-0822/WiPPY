import { RunTracer } from '../services/runTrace';
import type { LLMMessage } from '../services/llmProvider';

// Fake Timestamp — identity-compared, so we can assert it propagates verbatim.
const TTL = { seconds: 9999, nanoseconds: 0 } as unknown as import('firebase-admin/firestore').Timestamp;

function makeDb() {
  const committed: Array<{ id: string; data: any }> = [];
  const db: any = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn((id: string) => ({ id })),
        })),
      })),
    })),
    batch: jest.fn(() => {
      const staged: Array<{ id: string; data: any }> = [];
      return {
        set: (ref: { id: string }, data: any) => staged.push({ id: ref.id, data }),
        commit: () => {
          committed.push(...staged);
          return Promise.resolve();
        },
      };
    }),
    committed,
  };
  return db;
}

describe('RunTracer — sequencing & flushing', () => {
  it('assigns monotonically increasing seq across multiple flushes', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    t.stageEnter('load_context');
    t.stageExit('load_context');
    await t.flush();
    t.stageEnter('build_prompt');
    t.stageExit('build_prompt');
    await t.flush();

    expect(db.committed.map((e: any) => e.data.seq)).toEqual([0, 1, 2, 3]);
    // doc ids are zero-padded so natural lexicographic order matches seq order
    expect(db.committed.map((e: any) => e.id)).toEqual(['000000', '000001', '000002', '000003']);
  });

  it('flush is a no-op when there are no buffered events', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    await t.flush();
    expect(db.batch).not.toHaveBeenCalled();
    expect(db.committed).toHaveLength(0);
  });

  it('does not re-write events on a second flush', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    t.stageEnter('load_context');
    await t.flush();
    await t.flush();
    expect(db.committed).toHaveLength(1);
    expect(db.batch).toHaveBeenCalledTimes(1);
  });

  it('attaches the run ttlExpiry to every event', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    t.stageEnter('load_context');
    await t.flush();
    expect(db.committed[0].data.ttlExpiry).toBe(TTL);
  });
});

describe('RunTracer — stage duration', () => {
  it('computes stage durationMs from enter to exit', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(1_000) // stageEnter
      .mockReturnValueOnce(1_250); // stageExit
    t.stageEnter('run_planner');
    t.stageExit('run_planner');
    nowSpy.mockRestore();
    await t.flush();

    const enter = db.committed.find((e: any) => e.data.type === 'stage_enter');
    const exit = db.committed.find((e: any) => e.data.type === 'stage_exit');
    expect(enter.data.durationMs).toBeUndefined();
    expect(exit.data.durationMs).toBe(250);
  });
});

describe('RunTracer — LLM I/O fidelity', () => {
  it('stores full LLM input and output without truncation', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    const bigOutput = 'x'.repeat(50_000);
    const input: LLMMessage[] = [
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'hello' },
    ];
    t.llmCall('run_planner', input, bigOutput, 2_400);
    await t.flush();

    const ev = db.committed[0].data;
    expect(ev.type).toBe('llm_call');
    expect(ev.durationMs).toBe(2_400);
    expect(ev.payload.output).toBe(bigOutput);
    expect(ev.payload.output.length).toBe(50_000);
    expect(ev.payload.input).toEqual([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'hello' },
    ]);
    expect(ev.payload.inputMessageCount).toBe(2);
    expect(ev.payload.outputLength).toBe(50_000);
  });
});

describe('RunTracer — validation, repair, persist, error', () => {
  it('records validation and repair events with feedback', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    t.validation('validate_output', false, 'sequenceOrder 重複');
    t.repair('validate_output', 'repair prompt', 'repaired output');
    await t.flush();
    expect(db.committed[0].data.payload).toEqual({ valid: false, feedback: 'sequenceOrder 重複' });
    expect(db.committed[1].data.payload).toEqual({ prompt: 'repair prompt', output: 'repaired output' });
  });

  it('records persist events with ids and batch index', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    t.persist('persist_effects', ['m1', 'm2'], ['k1'], 0);
    await t.flush();
    expect(db.committed[0].data.payload).toEqual({
      messageIds: ['m1', 'm2'],
      knowledgeIds: ['k1'],
      batchIndex: 0,
    });
  });

  it('captures error message and stack', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    t.error('run_planner', new Error('boom'));
    await t.flush();
    const ev = db.committed[0].data;
    expect(ev.type).toBe('error');
    expect(ev.payload.message).toBe('boom');
    expect(typeof ev.payload.stack).toBe('string');
  });
});

describe('RunTracer — crash resilience', () => {
  it('preserves already-flushed events when a later stage fails', async () => {
    const db = makeDb();
    const t = new RunTracer(db, 'run_1', TTL);
    // Stage 1 completes and flushes at its boundary.
    t.stageEnter('load_context');
    t.stageExit('load_context');
    await t.flush();
    // Stage 2 starts, then "crashes" — the orchestrator's catch records the
    // error and flushes before rethrowing.
    t.stageEnter('run_planner');
    t.error('run_planner', new Error('mid-run crash'));
    await t.flush();

    expect(db.committed.map((e: any) => e.data.type)).toEqual([
      'stage_enter',
      'stage_exit',
      'stage_enter',
      'error',
    ]);
    expect(db.committed.map((e: any) => e.data.seq)).toEqual([0, 1, 2, 3]);
  });
});
