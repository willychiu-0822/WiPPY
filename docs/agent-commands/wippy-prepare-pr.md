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
4. Run checks:
   - `npm test -- --runInBand` in `backend`
   - `npm run build` in `backend`
   - `npm run lint` in `frontend`
   - `npm run build` in `frontend`
   - `npm test` in `frontend`
5. Stage only intended files.
6. Commit with a concise conventional message, for example `chore: add PR-based CI/CD`.
7. Push with `git push -u origin <branch>`.
8. Create the PR:

```powershell
gh pr create --base main --head <branch> --title "<title>" --body-file <temp-body-file>
```

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

## PM UAT
- Confirmed by user:
- Notes:

## Deployment Impact
- ...
```

Return the PR URL and clearly say merge remains a user decision.
