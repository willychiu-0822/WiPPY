import { Request, Response, NextFunction } from 'express';

interface LiffVerifyResponse {
  sub?: string;
  aud?: string;
  exp?: number;
  name?: string;
  picture?: string;
}

interface LiffBypassUser {
  userId: string;
  displayName: string;
  pictureUrl: string;
}

declare global {
  namespace Express {
    interface Request {
      liffUserId?: string;
      liffDisplayName?: string;
      liffPictureUrl?: string;
    }
  }
}

function getDevBypassUser(): LiffBypassUser | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const raw = process.env.LIFF_DEV_BYPASS_USER;
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LiffBypassUser>;
    if (!parsed.userId || !parsed.displayName) {
      return null;
    }

    return {
      userId: parsed.userId,
      displayName: parsed.displayName,
      pictureUrl: parsed.pictureUrl ?? '',
    };
  } catch {
    return null;
  }
}

export async function liffAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const bypassUser = getDevBypassUser();
  if (bypassUser) {
    req.liffUserId = bypassUser.userId;
    req.liffDisplayName = bypassUser.displayName;
    req.liffPictureUrl = bypassUser.pictureUrl;
    next();
    return;
  }

  const channelId = process.env.LIFF_CHANNEL_ID;
  if (!channelId) {
    res.status(500).json({ error: 'LIFF_CHANNEL_ID is not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    res.status(401).json({ error: 'Missing ID token' });
    return;
  }

  try {
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: channelId,
      }).toString(),
    });

    if (!response.ok) {
      res.status(401).json({ error: 'Invalid or expired LIFF ID token' });
      return;
    }

    const payload = (await response.json()) as LiffVerifyResponse;
    if (payload.aud !== channelId) {
      res.status(401).json({ error: 'LIFF channel mismatch' });
      return;
    }

    if (!payload.sub) {
      res.status(401).json({ error: 'LIFF token missing subject' });
      return;
    }

    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      res.status(401).json({ error: 'LIFF ID token expired' });
      return;
    }

    req.liffUserId = payload.sub;
    req.liffDisplayName = payload.name ?? '';
    req.liffPictureUrl = payload.picture ?? '';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired LIFF ID token' });
  }
}
