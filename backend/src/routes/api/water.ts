import express, { Request, Response } from 'express';
import { getDb } from '../../firebase';
import { liffAuthMiddleware } from '../../middleware/liffAuth';
import {
  assertUserCanAccessWaterGroup,
  TAUNT_MESSAGES,
  DrinkType,
  ensureIdentity,
  getMemberProfile,
  getTodayLeaderboard,
  getGroupPulse,
  getWeeklyStats,
  logDrink,
  resolveWaterSession,
  WaterGroupAccessError,
  MAX_DRINK_ML,
} from '../../services/waterService';

const router = express.Router();

const VALID_DRINK_TYPES: DrinkType[] = ['water', 'tea', 'coffee', 'juice', 'other'];

export function validateDrinkInput(
  ml: unknown,
  drinkType: unknown
): { ok: true; ml: number; drinkType: DrinkType } | { ok: false; error: string } {
  if (!Number.isInteger(ml) || (ml as number) <= 0) {
    return { ok: false, error: 'ml must be a positive integer' };
  }
  if ((ml as number) > MAX_DRINK_ML) {
    return { ok: false, error: `ml must not exceed ${MAX_DRINK_ML}` };
  }
  if (!drinkType || !VALID_DRINK_TYPES.includes(drinkType as DrinkType)) {
    return { ok: false, error: 'drinkType is invalid' };
  }
  return { ok: true, ml: ml as number, drinkType: drinkType as DrinkType };
}

function formatErrorDetail(err: unknown): string {
  return err instanceof Error && err.message ? err.message : String(err);
}

export function toWaterApiErrorResponse(error: string, err: unknown): { status: number; body: Record<string, unknown> } {
  if (err instanceof WaterGroupAccessError) {
    return { status: err.status, body: { error: err.message, code: err.code } };
  }

  const detail = formatErrorDetail(err);
  if (/requires (a|an) index|firestore\/indexes|FAILED_PRECONDITION/i.test(detail)) {
    return {
      status: 503,
      body: {
        error: '喝水戰場正在準備中，請稍後再試。',
        code: 'water_index_building',
      },
    };
  }

  return { status: 500, body: { error } };
}

function sendServerError(res: Response, error: string, err: unknown): void {
  const response = toWaterApiErrorResponse(error, err);
  res.status(response.status).json(response.body);
}

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
    const { entryGroupId, entryGroupName, selectedGroupId } = req.body as {
      entryGroupId?: string;
      entryGroupName?: string;
      selectedGroupId?: string;
    };
    const resolved = await resolveWaterSession(getDb(), req.liffUserId!, {
      entryGroupId,
      entryGroupName,
      selectedGroupId,
    });

    if ('status' in resolved) {
      res.json(resolved);
      return;
    }

    const identity = await ensureIdentity(
      getDb(),
      { groupId: resolved.groupId, groupName: resolved.groupName },
      getCurrentUser(req)
    );
    const today = await getTodayLeaderboard(getDb(), resolved.groupId, req.liffUserId!);

    res.json({
      status: 'ready',
      activeGroup: {
        groupId: resolved.groupId,
        groupName: today.groupName || resolved.groupName,
        entryGroupId: entryGroupId?.trim() || resolved.groupId,
      },
      isNewUser: identity.isNewUser,
      user: identity.user,
      member: identity.member,
      today,
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_session_error', error: String(err) }));
    sendServerError(res, 'Failed to initialize water session', err);
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

    const validation = validateDrinkInput(ml, drinkType);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const resolvedGroupId = await assertUserCanAccessWaterGroup(getDb(), req.liffUserId!, groupId);
    const result = await logDrink(
      getDb(),
      resolvedGroupId,
      getCurrentUser(req),
      {
        ml: validation.ml,
        drinkType: validation.drinkType,
        groupName: groupName?.trim() || undefined,
      }
    );

    res.json(result);
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_drink_error', error: String(err) }));
    sendServerError(res, 'Failed to record drink', err);
  }
});

// GET /api/water/group/:groupId/today
router.get('/group/:groupId/today', liffAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = await assertUserCanAccessWaterGroup(getDb(), req.liffUserId!, String(req.params['groupId'] ?? ''));

    await ensureIdentity(getDb(), { groupId }, getCurrentUser(req));
    const leaderboard = await getTodayLeaderboard(getDb(), groupId, req.liffUserId!);
    res.json(leaderboard);
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_today_error', error: String(err) }));
    sendServerError(res, 'Failed to fetch today leaderboard', err);
  }
});

// GET /api/water/group/:groupId/me
router.get('/group/:groupId/me', liffAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = await assertUserCanAccessWaterGroup(getDb(), req.liffUserId!, String(req.params['groupId'] ?? ''));

    await ensureIdentity(getDb(), { groupId }, getCurrentUser(req));
    const profile = await getMemberProfile(getDb(), groupId, req.liffUserId!);
    res.json(profile);
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_me_error', error: String(err) }));
    sendServerError(res, 'Failed to fetch water profile', err);
  }
});

// GET /api/water/group/:groupId/stats
router.get('/group/:groupId/stats', liffAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = await assertUserCanAccessWaterGroup(getDb(), req.liffUserId!, String(req.params['groupId'] ?? ''));

    const stats = await getWeeklyStats(getDb(), groupId);
    res.json(stats);
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_stats_error', error: String(err) }));
    sendServerError(res, 'Failed to fetch weekly stats', err);
  }
});

// GET /api/water/group/:groupId/pulse — BE-6 (P1)
router.get('/group/:groupId/pulse', liffAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = await assertUserCanAccessWaterGroup(getDb(), req.liffUserId!, String(req.params['groupId'] ?? ''));
    const limit = Math.min(Number(req.query['limit'] ?? 20) || 20, 50);
    const result = await getGroupPulse(getDb(), groupId, limit);
    res.json(result);
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_pulse_error', error: String(err) }));
    sendServerError(res, 'Failed to fetch pulse', err);
  }
});

// GET /api/water/taunts
router.get('/taunts', liffAuthMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({ taunts: TAUNT_MESSAGES });
  } catch (err) {
    console.error(JSON.stringify({ event: 'water_taunts_error', error: String(err) }));
    sendServerError(res, 'Failed to fetch taunts', err);
  }
});

export { router as waterRouter };
