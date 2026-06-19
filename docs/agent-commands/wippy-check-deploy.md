# wippy-check-deploy

Check whether WiPPY production deployment completed after a merge.

## Steps

1. Run `gh auth status`. If invalid, report that GitHub Actions status cannot be checked.
2. Run:

```powershell
gh run list --workflow "Deploy Production" --branch main --limit 5 --json databaseId,status,conclusion,headSha,displayTitle,url,createdAt
```

3. If the latest deployment is running and the user asked to wait, run:

```powershell
gh run watch <run-id> --compact --exit-status
```

4. If deployment failed, run:

```powershell
gh run view <run-id> --log-failed
```

5. Check production endpoints:
   - Discover Cloud Run URL with `gcloud run services describe wippy-backend --region asia-east1 --project wippy-mvp --format=json` when needed.
   - Check Cloud Run `/health`.
   - Check Firebase Hosting `https://wippy-mvp.web.app`.
6. Report one of:
   - `已上線`
   - `部署中`
   - `部署失敗`
   - `main 已更新但尚未找到部署紀錄`

Include the workflow URL and health check result.
