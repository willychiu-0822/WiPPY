# WiPPY PR-Based CI/CD Workflow

This is the daily delivery flow for WiPPY.

## Branch Naming

Use:

```text
<agent>/<purpose>/<short-slug>
```

Agents:

- `codex`
- `claudecode`
- `human`

Purposes:

- `feature`
- `fix`
- `refactor`
- `chore`
- `hotfix`

Examples:

- `codex/feature/pr-cicd-workflow`
- `claudecode/fix/scheduler-timezone`
- `human/hotfix/cloud-run-env`

## PM Daily Flow

1. Ask Codex or Claude Code to build the change.
2. Do local or test-environment UAT.
3. Ask Codex: "幫我把這次改動準備成 PR".
4. Codex runs checks, commits, pushes, and opens a PR.
5. GitHub Actions runs CI on the PR.
6. Review the PR page:
   - CI checks are green.
   - The diff matches the request.
   - UAT notes are filled in.
7. Merge only when you approve.
8. Merging to `main` triggers production deploy.
9. Ask Codex: "幫我確認剛剛 merge 後有沒有部署成功".

## Shared Agent Commands

Codex and Claude Code use the same command source:

- Shared instructions: `docs/agent-commands/*.md`
- Codex entrypoints: `.codex/skills/*/SKILL.md`
- Claude Code entrypoints: `.claude/commands/*.md`

Update `docs/agent-commands/*.md` first when the workflow changes. Keep Codex skills and Claude Code commands as thin wrappers only.

## What CI Checks

PRs and pushes to `main` run:

- Backend install, TypeScript build, Jest tests.
- Frontend install, ESLint, production build, Vitest tests.

## What CD Deploys

Pushes to `main` deploy:

- Deployment target values are read from `deployment/production.env`.
- Backend source deploys to Cloud Run service `wippy-backend` in `asia-east1`.
- Frontend `frontend/dist` deploys to Firebase Hosting project `wippy-mvp`.
- Firestore rules and indexes deploy from `firestore.rules` and `firestore.indexes.json`.

## Required GitHub Configuration

Deployment target values live in `deployment/production.env`; do not duplicate them as GitHub variables unless intentionally overriding the workflow later.

Set these production environment secrets:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`
- `VITE_FIREBASE_API_KEY`

## Required GCP Configuration

Create a deploy service account:

```text
github-actions-deployer@wippy-mvp.iam.gserviceaccount.com
```

Grant the minimum practical first-version roles:

- `roles/run.admin`
- `roles/cloudbuild.builds.editor`
- `roles/artifactregistry.writer`
- `roles/iam.serviceAccountUser`
- `roles/firebase.admin`

Configure Workload Identity Federation for:

```text
willychiu-0822/WiPPY
```

## Branch Protection

Protect `main` in GitHub:

- Require pull requests before merging.
- Require status checks to pass.
- Require the `CI / Backend build and test` check.
- Require the `CI / Frontend lint, build, and test` check.
- Prefer squash merge.
- Do not allow direct pushes to `main`.

## Useful GitHub CLI Commands

```powershell
gh auth status
gh pr create --base main --head <branch>
gh pr checks <pr> --watch
gh pr merge <pr> --squash --delete-branch
gh run list --workflow "Deploy Production" --branch main --limit 5
gh run watch <run-id> --compact --exit-status
gh run view <run-id> --log-failed
```
