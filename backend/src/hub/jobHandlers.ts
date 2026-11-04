import type { HubContext } from './core/context';
import { PermanentError, runJob, type HubJob, type JobHandlers, type JobOutcome } from './core/jobs';
import { downloadMediaAsset, onMediaDownloadFailed } from './media';

type HandlerFactory = (ctx: HubContext) => JobHandlers[keyof JobHandlers];

const extraHandlers: Partial<Record<keyof JobHandlers, HandlerFactory>> = {};

/** Later modules (dispatch, actions) register their job handlers here. */
export function registerJobHandler(type: keyof JobHandlers, factory: HandlerFactory): void {
  extraHandlers[type] = factory;
}

function payloadString(job: HubJob, key: string): string {
  const value = job.payload?.[key];
  if (typeof value !== 'string' || !value) throw new PermanentError(`job ${job.id} is missing payload.${key}`);
  return value;
}

export function buildJobHandlers(ctx: HubContext): JobHandlers {
  const missing = (type: string) => ({
    run: async () => { throw new PermanentError(`no handler registered for ${type}`); },
    onFinalFailure: async () => undefined,
  });
  return {
    media_download: {
      run: (job) => downloadMediaAsset(ctx, payloadString(job, 'mediaAssetId')),
      onFinalFailure: (job, error) => onMediaDownloadFailed(ctx, payloadString(job, 'mediaAssetId'), error),
    },
    dispatch: extraHandlers.dispatch?.(ctx) ?? missing('dispatch'),
    action_execute: extraHandlers.action_execute?.(ctx) ?? missing('action_execute'),
  };
}

export function runHubJob(ctx: HubContext, job: HubJob): Promise<JobOutcome> {
  return runJob(job, buildJobHandlers(ctx), ctx.queue);
}
