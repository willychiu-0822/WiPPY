import {
  backoffSeconds,
  MAX_ATTEMPTS,
  PermanentError,
  RecordingQueue,
  RetryableError,
  runJob,
  type JobHandlers,
} from '../../hub/core/jobs';

function handlers(run: jest.Mock, onFinalFailure = jest.fn().mockResolvedValue(undefined)): JobHandlers {
  return {
    media_download: { run, onFinalFailure },
    dispatch: { run, onFinalFailure },
    action_execute: { run, onFinalFailure },
  };
}

describe('backoffSeconds', () => {
  it('doubles from 10s and caps at 10 minutes', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(backoffSeconds)).toEqual([10, 20, 40, 80, 160, 320, 600, 600]);
  });
});

describe('runJob', () => {
  it('finishes a successful job without re-enqueueing', async () => {
    const queue = new RecordingQueue();
    const run = jest.fn().mockResolvedValue(undefined);
    const outcome = await runJob({ type: 'dispatch', id: 'd1', attempt: 1 }, handlers(run), queue);
    expect(outcome).toBe('done');
    expect(queue.jobs).toHaveLength(0);
  });

  it('re-enqueues retryable failures with backoff and the next attempt number', async () => {
    const queue = new RecordingQueue();
    const run = jest.fn().mockRejectedValue(new RetryableError('busy'));
    const outcome = await runJob({ type: 'dispatch', id: 'd1', attempt: 2, payload: { x: 1 } }, handlers(run), queue);
    expect(outcome).toBe('retry_scheduled');
    expect(queue.jobs).toEqual([{ job: { type: 'dispatch', id: 'd1', attempt: 3, payload: { x: 1 } }, delaySeconds: 20 }]);
  });

  it('honours an explicit retry delay from the handler', async () => {
    const queue = new RecordingQueue();
    const run = jest.fn().mockRejectedValue(new RetryableError('rate limited', 45));
    await runJob({ type: 'dispatch', id: 'd1', attempt: 1 }, handlers(run), queue);
    expect(queue.jobs[0].delaySeconds).toBe(45);
  });

  it('treats unknown errors as retryable', async () => {
    const queue = new RecordingQueue();
    const run = jest.fn().mockRejectedValue(new Error('socket hang up'));
    expect(await runJob({ type: 'media_download', id: 'm1', attempt: 1 }, handlers(run), queue)).toBe('retry_scheduled');
  });

  it('calls onFinalFailure after the last attempt instead of retrying', async () => {
    const queue = new RecordingQueue();
    const onFinal = jest.fn().mockResolvedValue(undefined);
    const run = jest.fn().mockRejectedValue(new RetryableError('still down'));
    const outcome = await runJob({ type: 'dispatch', id: 'd1', attempt: MAX_ATTEMPTS }, handlers(run, onFinal), queue);
    expect(outcome).toBe('failed');
    expect(queue.jobs).toHaveLength(0);
    expect(onFinal).toHaveBeenCalledWith(expect.objectContaining({ id: 'd1' }), expect.any(RetryableError));
  });

  it('fails permanent errors immediately', async () => {
    const queue = new RecordingQueue();
    const onFinal = jest.fn().mockResolvedValue(undefined);
    const run = jest.fn().mockRejectedValue(new PermanentError('bad key'));
    expect(await runJob({ type: 'dispatch', id: 'd1', attempt: 1 }, handlers(run, onFinal), queue)).toBe('failed');
    expect(onFinal).toHaveBeenCalledTimes(1);
  });

  it('RecordingQueue.drain runs queued jobs (including retries) until empty', async () => {
    const queue = new RecordingQueue();
    let calls = 0;
    const run = jest.fn(async () => {
      calls += 1;
      if (calls < 3) throw new RetryableError('flaky');
    });
    await queue.enqueue({ type: 'dispatch', id: 'd1', attempt: 1 });
    const outcomes = await queue.drain((job) => runJob(job, handlers(run), queue));
    expect(outcomes).toEqual(['retry_scheduled', 'retry_scheduled', 'done']);
    expect(queue.jobs).toHaveLength(0);
  });
});

describe('CloudTasksQueue', () => {
  it('posts a task to the hub job endpoint with secret header and scheduleTime for delays', async () => {
    const { CloudTasksQueue } = await import('../../hub/core/jobs');
    const fetchFn = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    const queue = new CloudTasksQueue({
      project: 'p', location: 'asia-east1', queue: 'wippy-hub-jobs', serviceUrl: 'https://svc.run.app/',
      secret: 's3cret', fetchFn: fetchFn as unknown as typeof fetch, getToken: async () => 'tok',
      now: () => new Date('2026-11-04T00:00:00.000Z'),
    });
    await queue.enqueue({ type: 'dispatch', id: 'd1', attempt: 2 }, { delaySeconds: 30 });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://cloudtasks.googleapis.com/v2/projects/p/locations/asia-east1/queues/wippy-hub-jobs/tasks');
    expect(init.headers.Authorization).toBe('Bearer tok');
    const { task } = JSON.parse(init.body);
    expect(task.scheduleTime).toBe('2026-11-04T00:00:30.000Z');
    expect(task.httpRequest.url).toBe('https://svc.run.app/api/internal/hub/jobs');
    expect(task.httpRequest.headers['X-Hub-Job-Secret']).toBe('s3cret');
    expect(JSON.parse(Buffer.from(task.httpRequest.body, 'base64').toString())).toEqual({ type: 'dispatch', id: 'd1', attempt: 2 });
  });

  it('throws when Cloud Tasks rejects the task', async () => {
    const { CloudTasksQueue } = await import('../../hub/core/jobs');
    const fetchFn = jest.fn().mockResolvedValue({ ok: false, status: 403, text: async () => 'denied' });
    const queue = new CloudTasksQueue({ project: 'p', location: 'l', queue: 'q', serviceUrl: 'https://s', secret: 'x', fetchFn: fetchFn as unknown as typeof fetch, getToken: async () => 't' });
    await expect(queue.enqueue({ type: 'dispatch', id: 'd', attempt: 1 })).rejects.toThrow('403');
  });
});
