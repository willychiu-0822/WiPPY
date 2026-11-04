// Side-effect module: wires Agent Hub modules together (job handlers, hooks,
// alert delivery, scheduler tasks). Imported once by the app.
import { setLLMCallObserver } from '../services/llmProvider';
import { onActionFailed, runActionJob } from './actions';
import { deliverAlertDirect } from './alertDelivery';
import { setAlertDeliverer } from './alerts';
import type { HubJob } from './core/jobs';
import { PermanentError } from './core/jobs';
import { onDispatchFailed, runDispatch } from './dispatch';
import { registerSchedulerTask } from './http/schedulerRoutes';
import { alertOverdueInbox } from './inbox';
import { registerJobHandler } from './jobHandlers';
import { recordLlmCall } from './llmThrottle';
import { evaluateMessage, runScheduledRules } from './rules';
import { getHub } from './runtime';
import { setMessageStoredHook } from './webhook';

function dispatchIdOf(job: HubJob): string {
  const id = job.payload?.['dispatchId'];
  if (typeof id !== 'string') throw new PermanentError('dispatch job without dispatchId');
  return id;
}

setAlertDeliverer(deliverAlertDirect);

registerJobHandler('dispatch', (ctx) => ({
  run: (job) => runDispatch(ctx, dispatchIdOf(job)),
  onFinalFailure: (job, error) => onDispatchFailed(ctx, dispatchIdOf(job), error),
}));

function actionIdOf(job: HubJob): string {
  const id = job.payload?.['actionId'];
  if (typeof id !== 'string') throw new PermanentError('action job without actionId');
  return id;
}

registerJobHandler('action_execute', (ctx) => ({
  run: (job) => runActionJob(ctx, actionIdOf(job)),
  onFinalFailure: (job, error) => onActionFailed(ctx, actionIdOf(job), error),
}));

setMessageStoredHook(async (ctx, message) => {
  await evaluateMessage(ctx, message);
});

registerSchedulerTask('hub-tick', async () => {
  const ctx = getHub();
  const dispatched = await runScheduledRules(ctx);
  const overdueAlerts = await alertOverdueInbox(ctx);
  return { dispatched: dispatched.length, overdueAlerts };
});

setLLMCallObserver(() => {
  recordLlmCall(getHub()).catch((err) => console.warn(JSON.stringify({ severity: 'WARNING', event: 'hub_llm_observer_error', error: String(err) })));
});

export {};
