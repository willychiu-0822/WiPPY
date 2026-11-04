import express, { type Request, type Response } from 'express';
import type { HubJob } from '../core/jobs';
import { runHubJob } from '../jobHandlers';
import { getHub } from '../runtime';
import { asyncRoute } from './util';

const JOB_TYPES = ['media_download', 'dispatch', 'action_execute'];

export const internalHubRouter = express.Router();

// POST /api/internal/hub/jobs — Cloud Tasks delivery target. Always 200 once the
// job ran: retries are scheduled by the runner itself, not by Cloud Tasks.
internalHubRouter.post('/jobs', asyncRoute(async (req: Request, res: Response) => {
  const secret = process.env['INTERNAL_HARNESS_SECRET'];
  if (!secret || req.headers['x-hub-job-secret'] !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const job = req.body as Partial<HubJob>;
  if (!job || typeof job.id !== 'string' || !JOB_TYPES.includes(String(job.type)) || typeof job.attempt !== 'number') {
    res.status(400).json({ error: 'Invalid job' });
    return;
  }
  const outcome = await runHubJob(getHub(), job as HubJob);
  res.json({ ok: true, outcome });
}));
