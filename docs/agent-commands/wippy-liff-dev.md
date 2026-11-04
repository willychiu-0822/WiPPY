# wippy-liff-dev

Develop, debug, test, or UAT WiPPY LIFF flows using the shared LIFF dev toolchain.

Use this for LIFF feature work, LIFF bug fixes, LINE App debugging, mock preset changes, or share flow issues.

## Goal

Keep Codex and Claude Code aligned on one LIFF workflow:

- reuse the shared LIFF infrastructure instead of re-implementing init, auth, or share;
- reproduce with the right mock preset;
- add or update focused Vitest coverage;
- report PM UAT links and remaining real LINE App checks.

## Required context

Before editing code, read `docs/liff-dev-uat.md` and inspect the current LIFF surface:

```powershell
rg -n "VITE_LIFF_DEV|mockPreset|LiffProvider|useLiff|shareLineMessage|liffAuthMiddleware" frontend/src backend/src
```

## Local workflow

1. Confirm the branch and worktree state with `git status --short --branch`.
2. Pick the mock preset that matches the requested behavior (`default`, `no_group`, `share_unavailable`). If none fits, add the smallest preset needed in `frontend/src/lib/liffDev.ts`.
3. Start frontend LIFF dev mode:

```powershell
cd frontend
npm run dev:liff
```

4. Implement the smallest scoped change.
5. Add or update frontend Vitest coverage for changed LIFF behavior.
6. If backend LIFF auth, LIFF API routes, or token behavior changed, also add or update backend tests.

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

Follow the troubleshooting order in `docs/liff-dev-uat.md` before escalating.

## Handoff to PR flow

After implementation and UAT, use `docs/agent-commands/wippy-prepare-pr.md`.

Do not duplicate this workflow in Codex or Claude wrappers. This file is the source of truth.
