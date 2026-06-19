# wippy-check-pr

Check whether a WiPPY PR is ready to merge.

## Steps

1. Run `gh auth status`. If invalid, stop and ask the user to run `gh auth login -h github.com`.
2. Identify the PR from the user's number, URL, branch, or current branch.
3. Run:

```powershell
gh pr view <pr> --json number,title,state,mergeStateStatus,baseRefName,headRefName,url
gh pr checks <pr> --json name,state,bucket,workflow,link
```

4. If checks are pending and the user asked to wait, run:

```powershell
gh pr checks <pr> --watch --fail-fast
```

5. Report:
   - PR URL
   - target branch
   - pass/fail/pending status
   - failed check names and links
   - whether it is ready for the user to merge

Do not merge in this command.
