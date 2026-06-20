import express, { Request, Response } from 'express';
import { getDb } from '../../firebase';
import { liffAuthMiddleware } from '../../middleware/liffAuth';
import {
  TAUNT_MESSAGES,
  DrinkType,
  ensureIdentity,
  getMemberProfile,
  getTodayLeaderboard,
  getWeeklyStats,
  logDrink,
} from '../../services/waterService';

const router = express.Router();

const VALID_DRINK_TYPES: DrinkType[] = ['water', 'tea', 'coffee', 'juice', 'other'];

function getCurrentUser(req: Request) {
  return {
    userId: req.liffUserId!,
    displayName: req.liffDisplayName ?? '',
    pictureUrl: req.liffPictureUrl ?? '',
  };
}

// POST /api/water/session
router.post('/session', liffAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { groupId, groupName } = req.body as { groupId?: string; groupName?: string };
    if (!groupId?.trim()) {
      res.status(400).json({ error: 'groupId is required' });
      return;
    }

    const identity = await ensureIdentity(
      getDb(),
      { groupId: groupId.trim(), groupName: groupName?.trim() || undefined },
      getCurrentUser(req)
    );
    const today = await getTodayLeaderboard(getDb(), groupId.trim(), req.liffUserId!);

    res.json({
      isNewUser: identity.isNewUser,
      user: identity.user,
      member: identity.member,
      today,
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_session_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to initialize water session' });
  }
});

// POST /api/water/drink
router.post('/drink', liffAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { groupId, groupName, ml, drinkType } = req.body as {
      groupId?: string;
      groupName?: string;
      ml?: number;
      drinkType?: DrinkType;
    };

    if (!groupId?.trim()) {
      res.status(400).json({ error: 'groupId is required' });
      return;
    }

    if (!Number.isInteger(ml) || (ml ?? 0) <= 0) {
      res.status(400).json({ error: 'ml must be a positive integer' });
      return;
    }

    if (!drinkType || !VALID_DRINK_TYPES.includes(drinkType)) {
      res.status(400).json({ error: 'drinkType is invalid' });
      return;
    }

    const safeMl = ml as number;
    const result = await logDrink(
      getDb(),
      groupId.trim(),
      getCurrentUser(req),
      {
        ml: safeMl,
        drinkType,
        groupName: groupName?.trim() || undefined,
      }
    );

    res.json(result);
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_drink_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to record drink' });
  }
});

// GET /api/water/group/:groupId/today
router.get('/group/:groupId/today', liffAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = String(req.params['groupId'] ?? '').trim();
    if (!groupId) {
      res.status(400).json({ error: 'groupId is required' });
      return;
    }

    await ensureIdentity(getDb(), { groupId }, getCurrentUser(req));
    const leaderboard = await getTodayLeaderboard(getDb(), groupId, req.liffUserId!);
    res.json(leaderboard);
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_today_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch today leaderboard' });
  }
});

// GET /api/water/group/:groupId/me
router.get('/group/:groupId/me', liffAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = String(req.params['groupId'] ?? '').trim();
    if (!groupId) {
      res.status(400).json({ error: 'groupId is required' });
      return;
    }

    await ensureIdentity(getDb(), { groupId }, getCurrentUser(req));
    const profile = await getMemberProfile(getDb(), groupId, req.liffUserId!);
    res.json(profile);
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_me_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch water profile' });
  }
});

// GET /api/water/group/:groupId/stats
router.get('/group/:groupId/stats', liffAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = String(req.params['groupId'] ?? '').trim();
    if (!groupId) {
      res.status(400).json({ error: 'groupId is required' });
      return;
    }

    const stats = await getWeeklyStats(getDb(), groupId);
    res.json(stats);
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_stats_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

// GET /api/water/taunts
router.get('/taunts', liffAuthMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({ taunts: TAUNT_MESSAGES });
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_taunts_error', error: String(err) }));
    res.status(500).json({ error: 'Failed to fetch taunts' });
  }
});

export { router as waterRouter };
