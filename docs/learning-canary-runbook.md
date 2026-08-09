# WiPPY Learning Canary Runbook

This feature is a private canary. It is not a broad production rollout and must stay UID-gated until a separately approved verified-ingestion plan exists.

## Prerequisites

- Backend and frontend CI are green.
- `LEARNING_CORE_ENABLED=true` is set only for an intentional canary environment.
- Cloud Tasks, the learning reconcile scheduler, and required Firestore indexes are present.
- The target user is identified by Firebase UID, not LINE user ID.

## Verify infrastructure

Run these read-only checks before enabling a user:

```powershell
gcloud run services describe wippy-backend --region asia-east1 --project wippy-mvp --format=json
gcloud tasks queues describe wippy-learning-ingestion --location asia-east1 --project wippy-mvp --format=json
gcloud scheduler jobs describe wippy-learning-reconcile --location asia-east1 --project wippy-mvp --format=json
gcloud firestore indexes composite list --project wippy-mvp --format=json
```

Confirm the backend environment contains the expected `LEARNING_*` values and that no production Firebase credentials are used by local emulator tests.

## Enable one UID

From `backend/`:

```powershell
npm run learning:access -- <firebaseUid> true
```

Then verify:

```powershell
Invoke-RestMethod -Uri "https://<backend-host>/api/learning/access" -Headers @{ Authorization = "Bearer <firebase-id-token>" }
```

The response should show learning access for that UID only.

## Canary checks

For the enabled user:

1. Open `/learn`.
2. Import a short English source.
3. Wait for ingestion to complete.
4. Start a low-pressure round if reviewed expressions are available.
5. Verify the UI does not show streaks, due counts, XP, leaderboards, backlog, or mastery claims.
6. Open knowledge and confirm evidence is shown as conditional, not as “已學會”.

For a non-enabled user:

1. `/learn` redirects to `/groups`.
2. `/api/learning/knowledge` returns `404`.
3. Known source IDs from another user return `404`.

## Failure checks

- Queue: inspect Cloud Tasks queue depth and recent task failures.
- Worker: read Cloud Run logs for `/api/internal/learning/ingest` and `/api/internal/learning/reconcile`.
- API: check `/health` and learning API status codes.
- Firestore: confirm required learning indexes exist and no query is failing with `FAILED_PRECONDITION`.

Use:

```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=wippy-backend AND textPayload:(\"learning\" OR \"FAILED_PRECONDITION\")" --project wippy-mvp --limit 50 --freshness=24h --format=json
```

## Rollback

Rollback is non-destructive:

```powershell
npm run learning:access -- <firebaseUid> false
```

Do not delete `learning*` collections during rollback. Source text, attempts, knowledge records, and future share-independent notes are private user data and must remain owner-scoped unless the user explicitly deletes them.

If infrastructure is unhealthy, pause the reconcile scheduler rather than deleting data:

```powershell
gcloud scheduler jobs pause wippy-learning-reconcile --location asia-east1 --project wippy-mvp
```

## Privacy

Learning source text, paragraphs, attempts, issue reports, knowledge items, and evidence records are private to the Firebase UID. LINE identity is not the authority for permanent learning data.

## Broad rollout gate

Do not broaden access until a separate verified-ingestion plan defines named dictionary/corpus evidence, ambiguity handling, source-span grounding, and review workflow for general expressions.
