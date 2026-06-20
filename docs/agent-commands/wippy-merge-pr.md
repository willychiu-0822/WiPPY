# wippy-merge-pr

Merge an approved WiPPY PR with squash merge after CI passes.

Use only when the user explicitly asks to merge.

## Steps

1. Run `gh auth status`. If invalid, stop and ask the user to run `gh auth login -h github.com`.
2. Identify the PR number or URL.
3. Run:

```powershell
gh pr view <pr> --json number,title,state,baseRefName,headRefName,mergeStateStatus,url
gh pr checks <pr> --required --json name,bucket,state,link
```

4. If required checks are failing or pending, do not merge. Report the blockers.
5. If checks pass, merge using a GitHub-first command that does not depend on the current local worktree branch state. Prefer running from a neutral directory or passing `--repo` explicitly:

```powershell
gh pr merge <pr> --repo <owner>/<repo> --squash --delete-branch
```

6. Report the merge result and tell the user that production deployment should start from the `main` push workflow.

## Worktree safety

WiPPY commonly uses multiple local worktrees such as `main`, `codex/...`, and `claudecode/...`.

- Do not assume the current worktree can safely switch to or clean up `main`.
- Prefer a GitHub-only merge flow over commands that implicitly manipulate local branches.
- If `gh pr merge` fails with a message like `'<branch>' is already used by worktree`, rerun the merge from a neutral directory and pass `--repo <owner>/<repo>`.

Never use `--admin` unless the user explicitly requests an emergency override.
