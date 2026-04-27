import express, { Request, Response } from 'express';
import { getDb } from '../../firebase';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

// GET /api/send-logs
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const limit = Math.min(Number(req.query['limit'] as string) || 30, 100);
    const activityId = req.query['activityId'] as string | undefined;
    const groupId = req.query['groupId'] as string | undefined;

    let query = db.collection('sendLogs')
      .where('userId', '==', req.userId)
      .orderBy('sentAt', 'desc')
      .limit(limit);

    // Note: Firestore doesn't support multiple inequality filters,
    // so activityId/groupId filters use equality
    if (activityId) {
      query = db.collection('sendLogs')
        .where('userId', '==', req.userId)
        .where('activityId', '==', activityId)
        .orderBy('sentAt', 'desc')
        .limit(limit);
    } else if (groupId) {
      query = db.collection('sendLogs')
        .where('userId', '==', req.userId)
        .where('groupId', '==', groupId)
        .orderBy('sentAt', 'desc')
        .limit(limit);
    }

    const snap = await query.get();
    const logs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.json({ logs, hasMore: snap.docs.length === limit });
  } catch (err) {
    console.error(JSON.stringify({ event: 'get_send_logs_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch send logs' });
  }
});

export { router as sendLogsRouter };
