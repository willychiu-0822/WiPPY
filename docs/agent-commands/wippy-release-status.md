# wippy-release-status

Report what WiPPY version is currently in production.

## Steps

1. Run `git ls-remote origin main` to get the latest remote main commit.
2. Read `deployment/production.env` for production project, service, region, and URLs.
3. When GitHub auth works, run:

```powershell
gh run list --workflow "Deploy Production" --branch main --limit 5 --json databaseId,status,conclusion,headSha,url,createdAt
```

4. If GCP auth works, run:

```powershell
gcloud run services describe <CLOUD_RUN_SERVICE> --region <GCP_REGION> --project <GCP_PROJECT_ID> --format=json
```

5. Check Firebase Hosting:

```powershell
Invoke-WebRequest -Uri "<FIREBASE_HOSTING_URL>" -Method Get -UseBasicParsing
```

6. Check backend health from `CLOUD_RUN_URL`, or report that the URL could not be discovered.

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
