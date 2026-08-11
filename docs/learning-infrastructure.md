# Learning Infrastructure

Learning ingestion is canary-only and uses Cloud Tasks plus a reconcile scheduler in production. Local and CI E2E use Firebase emulators and the explicit inline queue adapter.

## Environment variables

Backend:

```text
LEARNING_CORE_ENABLED=true
LEARNING_TASKS_QUEUE=wippy-learning-ingestion
LEARNING_TASKS_LOCATION=asia-east1
LEARNING_TASKS_PROJECT_ID=wippy-mvp
LEARNING_TASKS_SERVICE_ACCOUNT=<task-invoker-service-account>
LEARNING_RECONCILE_JOB=wippy-learning-reconcile
LEARNING_WORKER_BASE_URL=<backend-url>
LEARNING_TASKS_AUDIENCE=<backend-url>
LEARNING_INLINE_QUEUE=false
```

`LEARNING_INLINE_QUEUE=true` is allowed only when `FIRESTORE_EMULATOR_HOST` is present.

Frontend:

```text
VITE_LEARNING_CORE_ENABLED=true
```

Access is still controlled per Firebase UID through `learningAccess/{uid}`.

## One-time production setup

Print the runtime service account:

```powershell
gcloud run services describe wippy-backend --region asia-east1 --project wippy-mvp --format="value(spec.template.spec.serviceAccountName)"
```

Create the task OIDC service account:

```powershell
gcloud iam service-accounts create wippy-learning-task --project wippy-mvp --display-name "WiPPY Learning Task Invoker"
```

Create the queue:

```powershell
gcloud tasks queues create wippy-learning-ingestion --location asia-east1 --project wippy-mvp --max-dispatches-per-second 5 --max-concurrent-dispatches 5
```

Grant Cloud Tasks enqueue permission to the Cloud Run runtime service account:

```powershell
gcloud projects add-iam-policy-binding wippy-mvp --member="serviceAccount:<cloud-run-runtime-sa>" --role="roles/cloudtasks.enqueuer"
```

Allow the runtime service account to use the task service account:

```powershell
gcloud iam service-accounts add-iam-policy-binding wippy-learning-task@wippy-mvp.iam.gserviceaccount.com --project wippy-mvp --member="serviceAccount:<cloud-run-runtime-sa>" --role="roles/iam.serviceAccountUser"
```

Allow the task service account to invoke Cloud Run:

```powershell
gcloud run services add-iam-policy-binding wippy-backend --region asia-east1 --project wippy-mvp --member="serviceAccount:wippy-learning-task@wippy-mvp.iam.gserviceaccount.com" --role="roles/run.invoker"
```

Allow the Cloud Tasks service agent to mint the task OIDC token:

```powershell
gcloud projects add-iam-policy-binding wippy-mvp --member="serviceAccount:service-<project-number>@gcp-sa-cloudtasks.iam.gserviceaccount.com" --role="roles/iam.serviceAccountTokenCreator"
```

Create the reconcile scheduler:

```powershell
gcloud scheduler jobs create http wippy-learning-reconcile --location asia-east1 --project wippy-mvp --schedule="* * * * *" --uri="https://<backend-host>/api/internal/learning/reconcile-enqueues" --http-method=POST --oidc-service-account-email="wippy-learning-task@wippy-mvp.iam.gserviceaccount.com" --oidc-token-audience="https://<backend-host>"
```

Grant the Cloud Scheduler service agent token creation permission if the project does not already have it:

```powershell
gcloud projects add-iam-policy-binding wippy-mvp --member="serviceAccount:service-<project-number>@gcp-sa-cloudscheduler.iam.gserviceaccount.com" --role="roles/iam.serviceAccountTokenCreator"
```

## Verification commands

```powershell
gcloud tasks queues describe wippy-learning-ingestion --location asia-east1 --project wippy-mvp --format=json
gcloud scheduler jobs describe wippy-learning-reconcile --location asia-east1 --project wippy-mvp --format=json
gcloud run services get-iam-policy wippy-backend --region asia-east1 --project wippy-mvp
gcloud iam service-accounts get-iam-policy wippy-learning-task@wippy-mvp.iam.gserviceaccount.com --project wippy-mvp
gcloud firestore indexes composite list --project wippy-mvp --format=json
```

## Safe rollback

Disable canary access first:

```powershell
npm run learning:access -- <firebaseUid> false
```

Pause the scheduler if ingestion needs to stop:

```powershell
gcloud scheduler jobs pause wippy-learning-reconcile --location asia-east1 --project wippy-mvp
```

Do not delete learning data as part of rollback.
