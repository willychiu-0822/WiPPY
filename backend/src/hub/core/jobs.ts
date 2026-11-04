import { getAccessToken } from '../../services/cloudTasksService';

export type HubJobType = 'media_download' | 'dispatch' | 'action_execute';

export interface HubJob {
  type: HubJobType;
  id: string;
  /** 1-based attempt number of this run. */
  attempt: number;
  payload?: Record<string, unknown>;
}

export interface JobQueue {
  enqueue(job: HubJob, opts?: { delaySeconds?: number }): Promise<void>;
}

/** Transient failure: the runner re-enqueues the job with backoff. */
export class RetryableError extends Error {
  constructor(message: string, readonly delaySeconds?: number) {
    super(message);
    this.name = 'RetryableError';
  }
}

/** Failure that retrying cannot fix (bad config, 4xx, invalid data). */
export class PermanentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentError';
  }
}

export const MAX_ATTEMPTS = 8;
const BASE_DELAY_SECONDS = 10;
const MAX_DELAY_SECONDS = 600;

/** Delay before retrying after `attempt` failed. */
export function backoffSeconds(attempt: number): number {
  return Math.min(BASE_DELAY_SECONDS * 2 ** (attempt - 1), MAX_DELAY_SECONDS);
}

export interface JobHandler {
  run(job: HubJob): Promise<void>;
  /** Called once when the job will not be retried any more. Must not throw. */
  onFinalFailure(job: HubJob, error: Error): Promise<void>;
}

export type JobHandlers = Record<HubJobType, JobHandler>;
export type JobOutcome = 'done' | 'retry_scheduled' | 'failed';

export async function runJob(job: HubJob, handlers: JobHandlers, queue: JobQueue): Promise<JobOutcome> {
  const handler = handlers[job.type];
  if (!handler) throw new Error(`unknown hub job type: ${job.type}`);
  try {
    await handler.run(job);
    return 'done';
  } catch (raw) {
    const error = raw instanceof Error ? raw : new Error(String(raw));
    const permanent = error instanceof PermanentError;
    if (!permanent && job.attempt < MAX_ATTEMPTS) {
      const delaySeconds = error instanceof RetryableError && error.delaySeconds !== undefined
        ? error.delaySeconds
        : backoffSeconds(job.attempt);
      await queue.enqueue({ ...job, attempt: job.attempt + 1 }, { delaySeconds });
      console.warn(JSON.stringify({ severity: 'WARNING', event: 'hub_job_retry', type: job.type, id: job.id, attempt: job.attempt, delaySeconds, error: error.message }));
      return 'retry_scheduled';
    }
    console.error(JSON.stringify({ severity: 'ERROR', event: 'hub_job_failed', type: job.type, id: job.id, attempt: job.attempt, error: error.message }));
    try {
      await handler.onFinalFailure(job, error);
    } catch (finalErr) {
      console.error(JSON.stringify({ severity: 'ERROR', event: 'hub_job_final_failure_handler_error', id: job.id, error: String(finalErr) }));
    }
    return 'failed';
  }
}

/** Test queue: records jobs; `drain` runs them (ignoring delays) until none remain. */
export class RecordingQueue implements JobQueue {
  jobs: Array<{ job: HubJob; delaySeconds: number }> = [];

  async enqueue(job: HubJob, opts?: { delaySeconds?: number }): Promise<void> {
    this.jobs.push({ job: structuredCloneJob(job), delaySeconds: opts?.delaySeconds ?? 0 });
  }

  async drain(run: (job: HubJob) => Promise<JobOutcome>, maxRuns = 100): Promise<JobOutcome[]> {
    const outcomes: JobOutcome[] = [];
    while (this.jobs.length && outcomes.length < maxRuns) {
      const next = this.jobs.shift()!;
      outcomes.push(await run(next.job));
    }
    return outcomes;
  }
}

function structuredCloneJob(job: HubJob): HubJob {
  return JSON.parse(JSON.stringify(job)) as HubJob;
}

/** Local/dev queue: runs jobs in-process after the delay. Not durable. */
export class InlineQueue implements JobQueue {
  private runner: ((job: HubJob) => Promise<unknown>) | null = null;

  setRunner(runner: (job: HubJob) => Promise<unknown>): void {
    this.runner = runner;
  }

  async enqueue(job: HubJob, opts?: { delaySeconds?: number }): Promise<void> {
    const runner = this.runner;
    if (!runner) throw new Error('InlineQueue runner not set');
    const delayMs = Math.max(0, (opts?.delaySeconds ?? 0) * 1000);
    setTimeout(() => {
      runner(job).catch((err) => console.error(JSON.stringify({ severity: 'ERROR', event: 'hub_inline_job_error', id: job.id, error: String(err) })));
    }, delayMs).unref?.();
  }
}

export interface CloudTasksQueueConfig {
  project: string;
  location: string;
  queue: string;
  serviceUrl: string;
  secret: string;
  fetchFn?: typeof fetch;
  getToken?: () => Promise<string>;
  now?: () => Date;
}

/** Production queue: one Cloud Task per job, delivered to /api/internal/hub/jobs. */
export class CloudTasksQueue implements JobQueue {
  constructor(private readonly config: CloudTasksQueueConfig) {}

  async enqueue(job: HubJob, opts?: { delaySeconds?: number }): Promise<void> {
    const { project, location, queue, serviceUrl, secret } = this.config;
    const fetchFn = this.config.fetchFn ?? fetch;
    const token = await (this.config.getToken ?? getAccessToken)();
    const now = this.config.now?.() ?? new Date();
    const delay = opts?.delaySeconds ?? 0;
    const task: Record<string, unknown> = {
      httpRequest: {
        httpMethod: 'POST',
        url: `${serviceUrl.replace(/\/$/, '')}/api/internal/hub/jobs`,
        headers: { 'Content-Type': 'application/json', 'X-Hub-Job-Secret': secret },
        body: Buffer.from(JSON.stringify(job)).toString('base64'),
      },
    };
    if (delay > 0) task['scheduleTime'] = new Date(now.getTime() + delay * 1000).toISOString();
    const url = `https://cloudtasks.googleapis.com/v2/projects/${project}/locations/${location}/queues/${queue}/tasks`;
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ task }),
    });
    if (!res.ok) {
      throw new Error(`Cloud Tasks enqueue failed ${res.status}: ${await res.text()}`);
    }
  }
}
