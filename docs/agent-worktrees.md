# WiPPY Agent Worktrees

WiPPY uses separate Git worktrees so Codex and Claude Code can work in parallel without mixing uncommitted changes.

## Layout

```text
WiPPY/
  Main/control checkout. Keep this clean when possible.

WiPPY-worktrees/codex/
  Codex-owned checkout for Codex tasks and PRs.

WiPPY-worktrees/claude/
  Claude Code-owned checkout for Claude tasks and PRs.
```

The current `WiPPY/` checkout may temporarily hold in-progress Claude Code work. Move Claude Code to `WiPPY-worktrees/claude/` after that work is committed, stashed, or otherwise resolved.

## Rules

- Start each task from the agent's own worktree.
- Create one branch per task.
- Do not develop directly on `main`.
- Do not switch branches when the current worktree has unrelated uncommitted changes.
- Do not mix Codex and Claude Code changes in the same PR unless intentionally coordinating one shared task.
- Before either Codex or Claude Code opens a PR, run the shared `wippy-prepare-pr` flow and its Testing Impact Gate.
- Before opening a PR, confirm the current branch and `git status --short`.

## Shared Agent Commands

Codex skills and Claude Code commands are thin entrypoints. The operational source of truth lives in `docs/agent-commands/`.

When CI/CD, PR preparation, merge, deploy, or release-status behavior changes, update `docs/agent-commands/` first so both agents inherit the same rule.

## Recommended Branch Names

```text
codex/<purpose>/<short-slug>
claudecode/<purpose>/<short-slug>
human/<purpose>/<short-slug>
```

Common purposes:

```text
feature
fix
refactor
chore
hotfix
```

## Creating Worktrees

From the control checkout:

```powershell
git fetch origin
git worktree add ..\WiPPY-worktrees\codex -b codex/chore/example origin/main
git worktree add ..\WiPPY-worktrees\claude -b claudecode/refactor/example origin/main
git worktree list
```

Use an existing branch name instead of `-b ... origin/main` when attaching a worktree to an already-created branch.
