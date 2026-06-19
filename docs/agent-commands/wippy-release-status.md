# wippy-release-status

Report what WiPPY version is currently in production.

## Steps

1. Run `git ls-remote origin main` to get the latest remote main commit.
2. When GitHub auth works, run:

```powershell
gh run list --workflow "Deploy Production" --branch main --limit 5 --json databaseId,status,conclusion,headSha,url,createdAt
```

3. If GCP auth works, run:

```powershell
gcloud run services describe wippy-backend --region asia-east1 --project wippy-mvp --format=json
```

4. Check Firebase Hosting:

```powershell
Invoke-WebRequest -Uri "https://wippy-mvp.web.app" -Method Get -UseBasicParsing
```

5. Check backend health from the discovered Cloud Run URL, or report that the URL could not be discovered.

## Output

Use this shape:

```text
Production status: 已上線 | 部署中 | 失敗 | 無法確認
Latest main commit: <sha>
Latest deploy run: <status> <url>
Backend health: <result>
Frontend health: <result>
Notes: <short explanation>
```
