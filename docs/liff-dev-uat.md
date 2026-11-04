# LIFF Dev and PM UAT

This is the shared PM and agent guide for WiPPY LIFF development, debugging, and UAT.

The reusable LIFF infrastructure is:

- `frontend/src/contexts/LiffContext.tsx` (`LiffProvider`) and `useLiff()`: LIFF init, LINE login, profile, ID token, and group/room context.
- `frontend/src/lib/liffEntry.ts`: read entry params from direct, `liff.state`, and hash-based LIFF redirects.
- `frontend/src/lib/liffShare.ts`: `shareLineMessage()` (sendMessages → shareTargetPicker fallback) and `closeLineWindow()`.
- `backend/src/middleware/liffAuth.ts`: `liffAuthMiddleware` verifies the LIFF ID token and sets `req.liffUserId`.

Wrap a new LIFF page in `<LiffProvider>` in `frontend/src/App.tsx`, outside the Firebase Auth `ProtectedRoute`.

## Local setup

Create a LIFF dev env file from the example:

```powershell
Copy-Item frontend/.env.liff-dev.example frontend/.env.liff-dev
```

Start the frontend in LIFF dev mode:

```powershell
cd frontend
npm run dev:liff
```

With `VITE_LIFF_DEV=true`, `LiffProvider` skips real LINE login and returns a dev profile (`Dev User`), a mock ID token, and the mock group `Cdev1`.

For backend calls without a real LIFF token, set `LIFF_DEV_BYPASS_USER` in `backend/.env` (ignored when `NODE_ENV=production`):

```text
LIFF_DEV_BYPASS_USER={"userId":"Udev1234567890","displayName":"Dev User"}
```

## Mock presets

Append `?mockPreset=<id>` to the LIFF page URL.

| Preset | What to verify |
|---|---|
| `default` | Normal group context (`groupId=Cdev1`). |
| `no_group` | Page opened outside a group; the page should show a friendly guard. |
| `share_unavailable` | `shareLineMessage()` throws; share action shows a readable failure. |

Add a preset in `frontend/src/lib/liffDev.ts` only when a new page needs a context state the existing ones cannot reproduce.

## LINE App real-device debugging

Use real LINE App testing when the change depends on WebView behavior, group context, LIFF permissions, ID token behavior, or share APIs.

For WebView debugging, use LINE's LIFF Inspector package:

```powershell
cd frontend
npm exec @line/liff-inspector
```

Then follow the LIFF Inspector terminal/browser instructions to connect Chrome DevTools to the LIFF WebView.

Use LIFF Inspector for:

- errors that only happen inside LINE App;
- missing `groupId` or unexpected context;
- `sendMessages` or `shareTargetPicker` failures;
- mobile WebView layout issues.

## Troubleshooting order

1. Frontend env: `VITE_LIFF_DEV`, `VITE_LIFF_ID`, `VITE_API_BASE_URL`.
2. Mock preset: confirm the `mockPreset` query param.
3. Backend dev bypass/env: `LIFF_DEV_BYPASS_USER`, `LIFF_CHANNEL_ID`.
4. Cloud Run and Firebase status for deployed paths.
5. LINE API Status: https://api.line-status.info/
6. LINE Developers Console: LIFF endpoint URL, scopes, share permissions, channel ID.

## Agent workflow

Codex and Claude Code must use:

```text
docs/agent-commands/wippy-liff-dev.md
```

The Codex skill and Claude command are wrappers only. Do not copy workflow steps into those wrappers.
