# wippy-check-deploy

Check whether WiPPY production deployment completed after a merge.

## Steps

1. Run `gh auth status`. If invalid, report that GitHub Actions status cannot be checked.
2. Read `deployment/production.env` for the production target.
3. Run:

```powershell
gh run list --workflow "Deploy Production" --branch main --limit 5 --json databaseId,status,conclusion,headSha,displayTitle,url,createdAt
```

4. If the latest deployment is running and the user asked to wait, run:

```powershell
gh run watch <run-id> --compact --exit-status
```

5. If deployment failed, run:

```powershell
gh run view <run-id> --log-failed
```

6. Check production endpoints:
   - Use `CLOUD_RUN_URL` from `deployment/production.env`, or discover it with `gcloud run services describe`.
   - Check Cloud Run `/health`.
   - Use `FIREBASE_HOSTING_URL` from `deployment/production.env`.
7. Report one of:
   - `已上線`
   - `部署中`
   - `部署失敗`
   - `main 已更新但尚未找到部署紀錄`

Include the workflow URL and health check result.
