import express, { Request, Response } from 'express';
import { getLineClient } from '../../line';

const router = express.Router();

// POST /api/internal/deploy-notify
// Called by GitHub Actions after a successful production deploy.
// Sends a LINE push message to the configured group with the new LIFF URL.
router.post('/deploy-notify', async (req: Request, res: Response) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== (process.env.INTERNAL_HARNESS_SECRET ?? '')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { groupId, url, version, workflowUrl } = req.body as {
    groupId?: string;
    url?: string;
    version?: string;
    workflowUrl?: string;
  };

  if (!groupId || !url || !version) {
    res.status(400).json({ error: 'Missing required fields: groupId, url, version' });
    return;
  }

  const text = [
    'WiPPY 正式版已更新',
    `版本: ${version}`,
    '測試網址:',
    url,
    ...(workflowUrl ? ['Workflow:', workflowUrl] : []),
  ].join('\n');

  try {
    const client = getLineClient();
    await client.pushMessage(groupId, { type: 'text', text });
    res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ severity: 'ERROR', message: String(err), version }));
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export { router as deployNotifyRouter };
