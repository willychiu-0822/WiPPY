## Summary
- update the shared WiPPY merge command to prefer GitHub-first PR merges with `--repo`
- document worktree safety guidance so Codex and Claude Code do not depend on local branch cleanup during merge

## Test Results
- Backend tests: not run
- Backend build: not run
- Frontend lint: not run
- Frontend build: not run
- Frontend tests: not run

## Testing Impact
- Tests added/updated: none
- Existing coverage relied on: none
- No new tests reason: docs/process-only change for shared merge instructions

## PM UAT
- Confirmed by user: requested a shared merge-skill update for Codex and Claude Code
- Notes: Claude Code entrypoint already points to the same shared command file

## Deployment Impact
- no production behavior change; future agent merges in multi-worktree setups should avoid local `main` cleanup conflicts
