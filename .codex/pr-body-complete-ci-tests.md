## Summary
- strengthen backend CI with route-level integration tests for health, auth boundaries, activity review flows, agent chat, and internal harness protection
- add Firestore rules guard tests for ownership and backend-only write protections
- add a Docker readiness CI job that builds the backend image, boots the container, and verifies `/health`

## Test Results
- Backend tests: passed (`npm test -- --runInBand`)
- Backend build: passed (`npm run build`)
- Frontend lint: passed (`npm run lint`)
- Frontend build: passed (`npm run build`)
- Frontend tests: passed (`npm test`)

## Testing Impact
- Tests added/updated: backend API integration tests, Firestore rules guard tests, CI Docker readiness check
- Existing coverage relied on: frontend component tests for review banner, message table, knowledge editor, and agent chat states
- No new tests reason: none

## PM UAT
- Confirmed by user: PM reviewed CI intent and agreed to open PR
- Notes: local Docker smoke could not run in Codex because `docker` is not installed in this environment; the new GitHub Actions job covers that readiness check on runner

## Deployment Impact
- production deploy remains gated by CI and now also requires backend container startup plus `/health` readiness to pass before merge to `main`
