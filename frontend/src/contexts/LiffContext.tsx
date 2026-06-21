import { useEffect, useState, type ReactNode } from 'react';
import liff from '@line/liff';
import type { Liff } from '@line/liff';
import { LiffContext, type LiffProfile } from './liff-context';
import { getActiveLiffMockPresetId } from '../lib/liffDev';
import { DEFAULT_GROUP_ID } from '../lib/liffMockPresets';

// ─── Dev fallback ─────────────────────────────────────────────────────────────

// Only activate dev fallback when VITE_LIFF_DEV is explicitly set to "true".
// Relying on typeof window or import.meta.env.DEV would break tests (jsdom has window).
const DEV_FALLBACK = import.meta.env.VITE_LIFF_DEV === 'true';

const DEV_PROFILE: LiffProfile = {
  userId: 'Udev1234567890',
  displayName: 'Dev User',
  pictureUrl: '',
  statusMessage: '',
};

const DEV_AVAILABILITY = {
  shareTargetPicker: { permission: true, minVer: '10.3.0' },
  multipleLiffTransition: { permission: true },
  subwindow: { permission: false, minVer: '10.3.0' },
  scanCode: { permission: false, minVer: '10.3.0' },
  scanCodeV2: { permission: false },
  getAdvertisingId: { permission: false },
  addToHomeScreen: { permission: false },
  bluetoothLeFunction: { permission: false, minVer: '10.3.0' },
  skipChannelVerificationScreen: { permission: false },
  videoPush: { permission: false },
  mediaPush: { permission: false },
  pictureInPicture: { permission: false },
  liffToLiff: { permission: false },
};

let liffMockInstalled = false;

type DecodedIdToken = ReturnType<Liff['getDecodedIDToken']>;

function formatLiffError(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    const code = 'code' in err && typeof err.code === 'string' ? err.code : null;
    return code ? `${code}: ${err.message}` : err.message;
  }

  if (err && typeof err === 'object') {
    const code = 'code' in err && typeof (err as { code?: unknown }).code === 'string'
      ? (err as { code: string }).code
      : null;
    const message = 'message' in err && typeof (err as { message?: unknown }).message === 'string'
      ? (err as { message: string }).message
      : null;

    if (code && message) return `${code}: ${message}`;
    if (message) return message;
    if (code) return code;
  }

  return fallback;
}

function buildProfileFromDecodedToken(decodedIdToken: DecodedIdToken): LiffProfile | null {
  if (!decodedIdToken?.sub) return null;

  return {
    userId: decodedIdToken.sub,
    displayName: decodedIdToken.name ?? 'LINE User',
    pictureUrl: decodedIdToken.picture ?? '',
    statusMessage: '',
  };
}

function buildDevContext(): ReturnType<Liff['getContext']> {
  if (getActiveLiffMockPresetId() === 'no_group') {
    return {
      type: 'none',
      availability: DEV_AVAILABILITY,
    } as unknown as ReturnType<Liff['getContext']>;
  }

  return {
    type: 'group',
    groupId: DEFAULT_GROUP_ID,
    utouId: undefined,
    roomId: undefined,
    availability: DEV_AVAILABILITY,
  } as unknown as ReturnType<Liff['getContext']>;
}

async function installLiffMockPlugin() {
  if (liffMockInstalled) return;
  try {
    const { LiffMockPlugin } = await import('@line/liff-mock');
    liff.use(new LiffMockPlugin());
    liffMockInstalled = true;
  } catch {
    liffMockInstalled = true;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LiffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    ready: false,
    loading: true,
    error: null as string | null,
    authRedirecting: false,
    profile: null as LiffProfile | null,
    context: null as ReturnType<Liff['getContext']>,
    idToken: null as string | null,
    groupId: null as string | null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Dev fallback: non-LINE browser in dev mode
      if (DEV_FALLBACK) {
        const devContext = buildDevContext();
        const devGroupId = devContext?.type === 'group'
          ? (devContext as { groupId?: string }).groupId ?? null
          : null;

        try {
          await installLiffMockPlugin();
          const initOptions = {
            liffId: import.meta.env.VITE_LIFF_ID || 'dev',
            mock: true,
          } as Parameters<Liff['init']>[0] & { mock: boolean };
          await liff.init(initOptions);
        } catch {
          // Expected to fail in some non-LINE browsers; proceed with the local dev stub.
        }

        if (cancelled) return;
        setState({
          ready: true,
          loading: false,
          error: null,
          authRedirecting: false,
          profile: DEV_PROFILE,
          context: devContext,
          idToken: 'dev-mock-id-token',
          groupId: devGroupId,
        });
        return;
      }

      try {
        await liff.init({
          liffId: import.meta.env.VITE_LIFF_ID,
          withLoginOnExternalBrowser: true,
        });

        if (!liff.isLoggedIn()) {
          setState((current) => ({
            ...current,
            ready: false,
            loading: false,
            error: '需要 LINE 登入才能開啟喝水頁面。若未自動跳轉，請回到 LINE 群組重新開啟專屬連結。',
            authRedirecting: true,
          }));
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const ctx = liff.getContext();
        const idToken = liff.getIDToken();
        const decodedIdToken = liff.getDecodedIDToken();

        if (!idToken || !decodedIdToken?.sub) {
          throw new Error('LIFF ID token unavailable');
        }

        let profile: LiffProfile;
        try {
          profile = await liff.getProfile();
        } catch (profileError) {
          const fallbackProfile = buildProfileFromDecodedToken(decodedIdToken);
          if (!fallbackProfile) {
            throw new Error(formatLiffError(profileError, 'Unable to fetch LINE profile'));
          }
          profile = fallbackProfile;
        }

        const groupId =
          ctx?.type === 'group' ? (ctx as { groupId?: string }).groupId ?? null : null;

        if (cancelled) return;
        setState({
          ready: true,
          loading: false,
          error: null,
          authRedirecting: false,
          profile,
          context: ctx,
          idToken,
          groupId,
        });
      } catch (err) {
        if (cancelled) return;
        setState(s => ({
          ...s,
          ready: false,
          loading: false,
          error: formatLiffError(err, 'LIFF init failed'),
          authRedirecting: false,
        }));
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>;
}
