import { useEffect, useState, type ReactNode } from 'react';
import liff from '@line/liff';
import type { Liff } from '@line/liff';
import { LiffContext, type LiffProfile } from './liff-context';

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

const DEV_CONTEXT = {
  type: 'group' as const,
  groupId: 'Cdev1',
  utouId: undefined,
  roomId: undefined,
  availability: {
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
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LiffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    ready: false,
    loading: true,
    error: null as string | null,
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
        try {
          await liff.init({ liffId: import.meta.env.VITE_LIFF_ID || 'dev' });
        } catch {
          // expected to fail outside LINE — proceed with dev stub
        }

        if (cancelled) return;
        setState({
          ready: true,
          loading: false,
          error: null,
          profile: DEV_PROFILE,
          context: DEV_CONTEXT as unknown as ReturnType<Liff['getContext']>,
          idToken: 'dev-mock-id-token',
          groupId: 'Cdev1',
        });
        return;
      }

      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const [profile, ctx, idToken] = await Promise.all([
          liff.getProfile(),
          Promise.resolve(liff.getContext()),
          Promise.resolve(liff.getIDToken()),
        ]);

        const groupId =
          ctx?.type === 'group' ? (ctx as { groupId?: string }).groupId ?? null : null;

        if (cancelled) return;
        setState({
          ready: true,
          loading: false,
          error: null,
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
          error: err instanceof Error ? err.message : 'LIFF init failed',
        }));
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>;
}
