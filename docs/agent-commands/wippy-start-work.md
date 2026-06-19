# wippy-start-work

Start WiPPY development work by syncing `main` and creating a correctly named branch.

## Inputs

Infer or ask for:

- `agent`: `codex`, `claudecode`, or `human`.
- `purpose`: `feature`, `fix`, `refactor`, `chore`, or `hotfix`.
- `short-slug`: lowercase kebab-case summary.

Branch format:

```text
<agent>/<purpose>/<short-slug>
```

## Steps

1. Run `git status --short --branch`.
2. If there are uncommitted changes, stop and explain that starting a new branch could mix work.
3. Run `git fetch origin`.
4. Switch to `main`.
5. Fast-forward from `origin/main`.
6. Create the branch with `git switch -c <branch>`.
7. Report the branch name and PR title prefix:

```text
[<agent>][<purpose>] <Title>
```

Never delete or overwrite user work. Never use `git reset --hard`.
