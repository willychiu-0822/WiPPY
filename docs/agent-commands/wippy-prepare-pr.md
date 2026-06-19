# wippy-prepare-pr

Prepare completed WiPPY work as a GitHub PR after user UAT.

## Required Branch Shape

Current branch must match:

```text
<agent>/<purpose>/<short-slug>
```

Allowed agents: `codex`, `claudecode`, `human`.
Allowed purposes: `feature`, `fix`, `refactor`, `chore`, `hotfix`.

## Steps

1. Run `gh auth status`. If invalid, stop and ask the user to run `gh auth login -h github.com`.
2. Run `git status --short --branch`; confirm the branch is not `main`.
3. Inspect `git diff --stat` and `git diff --cached --stat`.
4. Run the Testing Impact Gate below. If required tests are missing, add or update those tests before continuing.
5. Run checks:
   - `npm test -- --runInBand` in `backend`
   - `npm run build` in `backend`
   - `npm run lint` in `frontend`
   - `npm run build` in `frontend`
   - `npm test` in `frontend`
6. Stage only intended files.
7. Commit with a concise conventional message, for example `chore: add PR-based CI/CD`.
8. Push with `git push -u origin <branch>`.
9. Create the PR:

```powershell
gh pr create --base main --head <branch> --title "<title>" --body-file <temp-body-file>
```

## Testing Impact Gate

Before creating a PR, decide whether the change needs new or updated automated tests.

Add or update tests when the PR includes any of these changes:

- New or changed API routes.
- New or changed Firestore reads, writes, rules, indexes, or user ownership checks.
- Login, auth token, permission, or security behavior changes.
- Scheduler, LINE messaging, broadcast, Cloud Tasks, or any production side effect.
- Agent, LLM, harness, rate limit, or plan validation behavior.
- Frontend user flows for activities, groups, message review, send logs, settings, or onboarding.
- Bug fixes where a regression test can reproduce the old failure.
- Refactors of core behavior where tests are needed to prove behavior did not change.

Tests may be unnecessary for narrow documentation, copy, formatting, or visual-only changes. If no tests are added, record the reason in the PR body.

Use the smallest useful test level:

- Unit tests for pure business rules, validators, formatters, and isolated services.
- Backend integration tests for API route behavior, auth boundaries, Firestore interactions, and side effects.
- Frontend component tests for UI states and user interactions inside one component.
- End-to-end tests for critical user journeys that must not break before production deploys.

Do not create the PR until one of these is true:

- Required tests were added or updated and pass locally.
- Existing tests already cover the changed behavior, and the PR body explains where.
- No automated test is appropriate, and the PR body explains why.

## PR Body

Use this structure:

```markdown
## Summary
- ...

## Test Results
- Backend tests:
- Backend build:
- Frontend lint:
- Frontend build:
- Frontend tests:

## Testing Impact
- Tests added/updated:
- Existing coverage relied on:
- No new tests reason:

## PM UAT
- Confirmed by user:
- Notes:

## Deployment Impact
- ...
```

Return the PR URL and clearly say merge remains a user decision.
