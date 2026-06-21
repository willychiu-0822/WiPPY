import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import liff from '@line/liff';
import { useLiff } from '../../contexts/useLiff';
import {
  buildLiffPlaygroundUrl,
  buildLiffWaterUrl,
  getActiveLiffMockPresetId,
  LIFF_MOCK_PRESET_IDS,
  shouldExposeLiffDevTools,
  type LiffDevDiagnostics,
  type LiffMockPresetId,
} from '../../lib/liffDev';
import {
  getLastLiffMockError,
  LIFF_MOCK_PRESET_DESCRIPTIONS,
  resetActiveLiffMockState,
} from '../../lib/liffMockPresets';
import { shareLineMessage } from '../../lib/liffShare';

function safeIsInClient(): boolean {
  try {
    return typeof liff.isInClient === 'function' && liff.isInClient();
  } catch {
    return false;
  }
}

export default function LiffDevPlaygroundPage() {
  const liffState = useLiff();
  const [activePreset, setActivePreset] = useState<LiffMockPresetId>(getActiveLiffMockPresetId());
  const [copyStatus, setCopyStatus] = useState('');
  const [shareCheck, setShareCheck] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  const diagnostics: LiffDevDiagnostics = useMemo(() => ({
    ready: liffState.ready,
    loading: liffState.loading,
    error: liffState.error,
    profile: liffState.profile,
    context: liffState.context,
    groupId: liffState.groupId,
    hasIdToken: Boolean(liffState.idToken),
    activePreset,
    isInClient: safeIsInClient(),
    canSendMessages: typeof liff.sendMessages === 'function',
    canShareTargetPicker: typeof liff.shareTargetPicker === 'function',
    lastMockError: getLastLiffMockError(),
  }), [activePreset, liffState]);

  if (!shouldExposeLiffDevTools()) {
    return <Navigate to="/liff/water" replace />;
  }

  const uatPath = buildLiffWaterUrl(activePreset);
  const playgroundPath = buildLiffPlaygroundUrl(activePreset);

  function handlePresetChange(presetId: LiffMockPresetId) {
    setActivePreset(presetId);
    window.history.replaceState(null, '', buildLiffPlaygroundUrl(presetId));
    resetActiveLiffMockState();
    setResetStatus('Mock state reset');
    setCopyStatus('');
    setShareCheck('');
  }

  async function handleCopyLink() {
    const url = new URL(uatPath, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus(`Copied ${url}`);
    } catch {
      setCopyStatus(url);
    }
  }

  async function handleShareCheck() {
    setShareCheck('Checking...');
    try {
      await shareLineMessage({
        type: 'flex',
        altText: 'WiPPY LIFF dev share check',
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [{ type: 'text', text: 'WiPPY LIFF dev share check' }],
          },
        },
      });
      setShareCheck('Share capability succeeded');
    } catch (error) {
      setShareCheck(error instanceof Error ? error.message : 'Share capability failed');
    }
  }

  function handleReset() {
    resetActiveLiffMockState();
    setResetStatus('Mock state reset');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">WiPPY LIFF Dev</p>
          <h1 className="text-2xl font-bold">LIFF Playground</h1>
        </header>

        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <label className="text-sm font-semibold text-slate-700" htmlFor="mock-preset">
            Mock preset
          </label>
          <select
            id="mock-preset"
            value={activePreset}
            onChange={event => handlePresetChange(event.target.value as LiffMockPresetId)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {LIFF_MOCK_PRESET_IDS.map(presetId => (
              <option key={presetId} value={presetId}>{presetId}</option>
            ))}
          </select>
          <p className="text-sm text-slate-600">{LIFF_MOCK_PRESET_DESCRIPTIONS[activePreset]}</p>
          <div className="flex flex-wrap gap-2">
            <a href={uatPath} className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white">
              Open UAT page
            </a>
            <button onClick={handleCopyLink} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
              Copy UAT link
            </button>
            <button onClick={handleReset} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
              Reset mock state
            </button>
            <button onClick={handleShareCheck} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
              Check share
            </button>
          </div>
          {(copyStatus || resetStatus || shareCheck) && (
            <div className="grid gap-1 text-xs text-slate-500">
              {copyStatus && <p>{copyStatus}</p>}
              {resetStatus && <p>{resetStatus}</p>}
              {shareCheck && <p>{shareCheck}</p>}
            </div>
          )}
        </section>

        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">Diagnostics</h2>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <div><dt className="text-slate-500">Ready</dt><dd>{String(diagnostics.ready)}</dd></div>
            <div><dt className="text-slate-500">Loading</dt><dd>{String(diagnostics.loading)}</dd></div>
            <div><dt className="text-slate-500">Error</dt><dd>{diagnostics.error ?? 'none'}</dd></div>
            <div><dt className="text-slate-500">Profile</dt><dd>{diagnostics.profile?.displayName ?? 'none'}</dd></div>
            <div><dt className="text-slate-500">Context type</dt><dd>{diagnostics.context?.type ?? 'none'}</dd></div>
            <div><dt className="text-slate-500">Group ID</dt><dd>{diagnostics.groupId ?? 'none'}</dd></div>
            <div><dt className="text-slate-500">ID token</dt><dd>{diagnostics.hasIdToken ? 'present' : 'missing'}</dd></div>
            <div><dt className="text-slate-500">isInClient</dt><dd>{String(diagnostics.isInClient)}</dd></div>
            <div><dt className="text-slate-500">sendMessages</dt><dd>{diagnostics.canSendMessages ? 'available' : 'missing'}</dd></div>
            <div><dt className="text-slate-500">shareTargetPicker</dt><dd>{diagnostics.canShareTargetPicker ? 'available' : 'missing'}</dd></div>
            <div><dt className="text-slate-500">Last mock error</dt><dd>{diagnostics.lastMockError ?? 'none'}</dd></div>
            <div><dt className="text-slate-500">Playground URL</dt><dd>{playgroundPath}</dd></div>
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Raw context</h2>
          <pre className="overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(diagnostics.context, null, 2)}
          </pre>
        </section>
      </main>
    </div>
  );
}
