# wippy-start-work

Start WiPPY development work by clarifying the task, syncing the local repo to the latest `main`, and creating a correctly named branch.

## Goal

Prepare a clean local workspace for one new WiPPY development task.

Use this when the user wants to start a new feature, fix, refactor, chore, or hotfix before coding.

## Clarify the task first

Before running Git commands, understand what the user is about to build.

Infer what you can from the request. If any required field is unclear, ask concise follow-up questions before touching the repo:

- `purpose`: one of `feature`, `fix`, `refactor`, `chore`, or `hotfix`.
- `area`: the product or code area affected, such as auth, booking, LINE messaging, admin, payments, backend, frontend, deploy, or tests.
- `short-slug`: a lowercase kebab-case summary, preferably 2-5 words.

Examples:

```text
feature/booking-calendar
fix/line-webhook-timeout
refactor/backend-slot-service
chore/update-ci-cache
hotfix/payment-callback
```

## Branch naming

Use the current agent as the first path segment:

- Codex: `codex/<purpose>/<short-slug>`
- Claude Code: `claudecode/<purpose>/<short-slug>`
- Human/manual fallback: `human/<purpose>/<short-slug>`

If the user explicitly requests a different branch name, use it only if it is clear and safe.

## Git workflow

Run these steps from the WiPPY repo root.

1. Run `git status --short --branch`.
2. If there are uncommitted changes, stop and explain that starting a new branch could mix work. Ask whether the user wants to commit, stash, or continue from the current branch. Do not stash automatically.
3. Run `git fetch origin`.
4. Switch to `main` with `git switch main`.
5. Fast-forward from the remote with `git merge --ff-only origin/main`.
6. Create the new branch with `git switch -c <branch>`.
7. Run `git status --short --branch` again.
8. Report:
   - the branch name;
   - the task area and purpose;
   - whether `main` was successfully fast-forwarded;
   - the suggested PR title prefix.

Suggested PR title prefix:

```text
[<agent>][<purpose>] <Title>
```

## Safety rules

- Never delete or overwrite user work.
- Never use `git reset --hard`.
- Never run `git clean` as part of this workflow.
- Do not use `git pull` if a fast-forward-only merge gives clearer failure behavior.
- If `git merge --ff-only origin/main` fails, stop and explain that local `main` diverged from `origin/main`; do not repair history without explicit user approval.
