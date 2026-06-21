# wippy-liff-dev

Develop, debug, test, or UAT WiPPY LIFF flows using the shared LIFF dev toolchain.

Use this for LIFF feature work, LIFF bug fixes, water tracker UAT, LINE App debugging, mock preset changes, or share flow issues.

## Goal

Keep Codex and Claude Code aligned on one LIFF workflow:

- reproduce with the right mock preset;
- verify behavior in `/dev/liff-playground` and `/liff/water`;
- add or update focused Vitest coverage;
- report PM UAT links and remaining real LINE App checks.

## Required context

Before editing code, inspect the current LIFF surface:

```powershell
rg -n "VITE_LIFF_DEV|VITE_USE_MOCK_API|mockPreset|LiffProvider|WaterTrackerPage|shareLineMessage" frontend/src
```

If the task mentions a specific bug, identify which preset reproduces it. If none exists, add or update the smallest preset needed.

## Mock presets

Use these preset URLs during development:

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

PM-facing UAT links use the same preset on `/liff/water`, for example:

```text
/liff/water?mockPreset=rank_behind
```

## Local workflow

1. Confirm the branch and worktree state with `git status --short --branch`.
2. Use the preset that matches the requested behavior.
3. Start frontend LIFF dev mode:

```powershell
cd frontend
npm run dev:liff
```

4. Verify `/dev/liff-playground` diagnostics before testing the actual LIFF page.
5. Implement the smallest scoped change.
6. Add or update frontend Vitest coverage for changed LIFF behavior.
7. If backend LIFF auth, water API, or token behavior changed, also add or update backend tests.

## Required checks

For frontend-only LIFF changes, run:

```powershell
cd frontend
npm test
npm run build
```

If lint-sensitive UI or shared code changed, also run:

```powershell
cd frontend
npm run lint
```

If backend LIFF auth/API changed, run:

```powershell
cd backend
npm test -- --runInBand
npm run build
```

## PM UAT report

Every LIFF dev task final response must include:

- presets tested;
- PM UAT links;
- automated test results;
- whether real LINE App testing was completed;
- if not tested in LINE App, say which checks remain;
- any LINE API Status or LINE Developers Console checks performed.

## Troubleshooting order

Follow this order before escalating:

1. Frontend env: `VITE_LIFF_DEV`, `VITE_USE_MOCK_API`, `VITE_LIFF_ID`, `VITE_API_BASE_URL`.
2. Mock preset: confirm `/dev/liff-playground` active preset and diagnostics.
3. Backend dev bypass/env: `LIFF_DEV_BYPASS_USER`, `LIFF_CHANNEL_ID`.
4. Cloud Run/Firebase status when testing deployed paths.
5. LINE API Status.
6. LINE Developers Console settings for LIFF URL, permissions, and channel ID.

## Handoff to PR flow

After implementation and UAT, use `docs/agent-commands/wippy-prepare-pr.md`.

Do not duplicate this workflow in Codex or Claude wrappers. This file is the source of truth.
