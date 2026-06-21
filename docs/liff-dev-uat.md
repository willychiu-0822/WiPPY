# LIFF Dev and PM UAT

This is the shared PM and agent guide for WiPPY LIFF development, debugging, and UAT.

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

Open:

```text
http://localhost:5173/dev/liff-playground
```

Use the playground first, then open the generated `/liff/water` UAT link.

## Mock presets

| Preset | What to verify |
|---|---|
| `default` | Normal group usage, session load, drink logging, leaderboard, share entry points. |
| `new_user` | First-time user state, zero progress, first drink achievement. |
| `rank_behind` | User starts behind other members; ranking and gap UI are clear. |
| `rank_first` | User starts first; lead-over-second and achievement/share UI are clear. |
| `no_group` | Page shows the friendly group-only guard. |
| `share_unavailable` | Share action shows a readable failure without breaking the page. |
| `api_401` | Session load shows token/auth style failure copy. |
| `api_500` | Session load shows backend failure copy and retry affordance. |

Direct links:

```text
/dev/liff-playground?mockPreset=default
/dev/liff-playground?mockPreset=new_user
/dev/liff-playground?mockPreset=rank_behind
/dev/liff-playground?mockPreset=rank_first
/dev/liff-playground?mockPreset=no_group
/dev/liff-playground?mockPreset=share_unavailable
/dev/liff-playground?mockPreset=api_401
/dev/liff-playground?mockPreset=api_500
```

PM UAT page links use the same preset on `/liff/water`.

## UAT checklist

For each relevant preset:

1. Confirm `/dev/liff-playground` shows the expected active preset.
2. Confirm diagnostics: ready, profile, context type, group ID, ID token presence, and share capability.
3. Open the UAT link.
4. Verify the page state matches the preset.
5. For normal ranking presets, submit a drink record and confirm the modal, leaderboard, and progress update.
6. For share-related work, click share and record whether the result is sent, shared, cancelled, or failed.

Record the tested preset URLs in the PR or handoff notes.

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

1. Frontend env: `VITE_LIFF_DEV`, `VITE_USE_MOCK_API`, `VITE_LIFF_ID`, `VITE_API_BASE_URL`.
2. Mock preset: confirm `/dev/liff-playground` active preset and diagnostics.
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
