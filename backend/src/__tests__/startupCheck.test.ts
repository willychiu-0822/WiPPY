import { findConfigGaps, reportConfigGaps } from '../config/startupCheck';

const full: NodeJS.ProcessEnv = {
  OWNER_USER_ID: 'U1',
  LINE_CHANNEL_SECRET: 's',
  LINE_CHANNEL_ACCESS_TOKEN: 't',
  SCHEDULER_SECRET: 'x',
  HUB_ENCRYPTION_KEY: 'k',
  LLM_PROVIDER: 'gemini',
  GEMINI_API_KEY: 'g',
};

describe('startup config check', () => {
  it('reports nothing when everything is set', () => {
    expect(findConfigGaps(full)).toEqual([]);
  });

  it('lists names of missing settings, never values', () => {
    const logs: string[] = [];
    const gaps = reportConfigGaps({ NODE_ENV: 'production', LLM_PROVIDER: 'gemini', LINE_CHANNEL_SECRET: 'topsecret' }, (l) => logs.push(l));
    const names = gaps.map((g) => g.name);
    expect(names).toEqual(expect.arrayContaining(['OWNER_USER_ID', 'SCHEDULER_SECRET', 'HUB_ENCRYPTION_KEY', 'GEMINI_API_KEY']));
    expect(names).not.toContain('LINE_CHANNEL_SECRET');
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain('OWNER_USER_ID');
    expect(logs[0]).not.toContain('topsecret');
  });

  it('requires Cloud Tasks callback settings only when a queue is configured', () => {
    expect(findConfigGaps(full).map((g) => g.name)).not.toContain('INTERNAL_HARNESS_SECRET');
    const names = findConfigGaps({ ...full, HUB_TASKS_QUEUE: 'q' }).map((g) => g.name);
    expect(names).toEqual(expect.arrayContaining(['INTERNAL_HARNESS_SECRET', 'CLOUD_RUN_SERVICE_URL']));
  });

  it('stays silent outside production', () => {
    const logs: string[] = [];
    expect(reportConfigGaps({}, (l) => logs.push(l))).toEqual([]);
    expect(logs).toEqual([]);
  });

  it('treats Cloud Run (K_SERVICE) as production and never throws', () => {
    const logs: string[] = [];
    expect(() => reportConfigGaps({ K_SERVICE: 'wippy-backend' }, (l) => logs.push(l))).not.toThrow();
    expect(logs).toHaveLength(1);
  });
});
