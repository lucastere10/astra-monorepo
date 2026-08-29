# GCP deploy — Astra Newsletter

Dockerfiles + Cloud Build + Cloud Run Service/Jobs + Cloud Scheduler.
Postgres stays on **Supabase**; secrets live in **Secret Manager**. No Terraform.

## Architecture

| Resource | Image / command | Trigger |
|----------|-----------------|---------|
| Cloud Run Service `astra-web` | `apps/web/Dockerfile` | HTTPS traffic |
| Cloud Run Job `astra-collect` | `collector collect` | Scheduler every 4h |
| Cloud Run Job `astra-deliver` | `collector deliver` | Scheduler 07:57 / 11:57 / 17:57 America/Sao_Paulo |

## One-time setup

### 1. Enable APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  iamcredentials.googleapis.com
```

### 2. Artifact Registry

```bash
REGION=us-central1
gcloud artifacts repositories create astra-images \
  --repository-format=docker \
  --location="$REGION" \
  --description="Astra Newsletter images"
```

### 3. Service accounts

```bash
PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

# Runtime SA for Cloud Run (web + jobs)
gcloud iam service-accounts create astra-sa \
  --display-name="Astra Cloud Run runtime"

# Cloud Build SA (custom — attach to the trigger)
gcloud iam service-accounts create cloud-build-sa \
  --display-name="Astra Cloud Build"

# Cloud Tasks SA (reserved for future task enqueue / invoke)
gcloud iam service-accounts create cloud-tasks-sa \
  --display-name="Astra Cloud Tasks"

# Scheduler invoker SA
gcloud iam service-accounts create scheduler-sa \
  --display-name="Astra Scheduler"

ASTRA_SA="astra-sa@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUDBUILD_SA="cloud-build-sa@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUDTASKS_SA="cloud-tasks-sa@${PROJECT_ID}.iam.gserviceaccount.com"
SCHEDULER_SA="scheduler-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Cloud Build needs to deploy Run + manage Scheduler + act as runtime SA
gcloud projects add-iam-policy-binding "$PROJECT_ID" `
  --member="serviceAccount:${CLOUDBUILD_SA}" `
  --role="roles/run.admin"
gcloud projects add-iam-policy-binding "$PROJECT_ID" `
  --member="serviceAccount:${CLOUDBUILD_SA}" `
  --role="roles/cloudscheduler.admin"
gcloud projects add-iam-policy-binding "$PROJECT_ID" `
  --member="serviceAccount:${CLOUDBUILD_SA}" `
  --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding "$PROJECT_ID" `
  --member="serviceAccount:${CLOUDBUILD_SA}" `
  --role="roles/iam.serviceAccountUser"
gcloud projects add-iam-policy-binding "$PROJECT_ID" `
  --member="serviceAccount:${CLOUDBUILD_SA}" `
  --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding "$PROJECT_ID" `
  --member="serviceAccount:${CLOUDBUILD_SA}" `
  --role="roles/logging.logWriter"

# Scheduler can invoke Jobs
# (bind after first job deploy, or pre-bind once jobs exist)
```

Point the Cloud Build trigger at `cloud-build-sa` (Service account →
`cloud-build-sa@…`) so builds do not use the default Cloud Build SA.

After the first successful deploy of the jobs:

```bash
gcloud run jobs add-iam-policy-binding astra-collect `
  --region="$REGION" `
  --member="serviceAccount:${SCHEDULER_SA}" `
  --role="roles/run.invoker"

gcloud run jobs add-iam-policy-binding astra-deliver `
  --region="$REGION" `
  --member="serviceAccount:${SCHEDULER_SA}" `
  --role="roles/run.invoker"
```

### 4. Secrets

Create the Secret Manager secrets listed at the bottom of this file before the first deploy.

### 5. Cloud Build trigger

Point a trigger at the repo root `cloudbuild.yaml` (branch `main`).
Override substitutions in the trigger UI as needed (`_NEXT_PUBLIC_APP_URL`, `_EMAIL_FROM`, …).
Use service account `cloud-build-sa`.

Manual run:

```bash
gcloud builds submit --config=cloudbuild.yaml .
```

After the first web deploy, set `_NEXT_PUBLIC_APP_URL` / `_APP_URL` to the
Cloud Run HTTPS URL (or your custom domain) and redeploy so magic links and
email tracking point at production.

If you previously deployed resources under another name, create the new `astra-*`
names (or migrate manually). This repo only targets `astra-*`.

## Local image builds

```bash
# Web (context = monorepo root)
docker build -f apps/web/Dockerfile -t astra-web .

# Collector
docker build -f workers/collector/Dockerfile -t astra-collector workers/collector
docker run --rm --env-file .env astra-collector collect
docker run --rm --env-file .env astra-collector deliver
```

## Manifests in this folder

| File | Purpose |
|------|---------|
| `cloud-run-web.yaml` | Desired Cloud Run Service shape |
| `cloud-run-job-collect.yaml` | Collect job (`collector collect`) |
| `cloud-run-job-deliver.yaml` | Deliver job (`collector deliver`) |
| `cloud-scheduler.yaml` | Cron definitions for both jobs |

Deploy is driven by root [`cloudbuild.yaml`](../cloudbuild.yaml); YAML files document
the target config and use `__PLACEHOLDER__` tokens for manual `envsubst` if needed.

# Secret Manager secrets (create once — do not commit real values)

Create these secrets in your GCP project before the first Cloud Build deploy.
Values come from your local `.env` / Supabase / Resend / OpenAI dashboards.

Env var names inside the containers stay the same (`DATABASE_URL`, …);
Secret Manager **resource names** use the `astra-*` prefix below.

## Required

| Secret Manager name       | Env var in container | Used by                    | Notes |
|---------------------------|----------------------|----------------------------|-------|
| `astra-database-url`      | `DATABASE_URL`       | web, collect, deliver      | Supabase **direct** connection (port 5432) for the worker; web can use pooler (6543) if you prefer a separate secret later. Start with one shared direct URL. |
| `astra-direct-url`        | `DIRECT_URL`         | web, migrate step          | Supabase direct URL for Prisma migrate. |
| `astra-session-secret`    | `SESSION_SECRET`     | web                        | `openssl rand -base64 32` |
| `astra-resend-api-key`    | `RESEND_API_KEY`     | web, deliver               | Resend API key |
| `astra-openai-api-key`    | `OPENAI_API_KEY`     | collect                    | Optional for local; recommended in prod |
| `astra-exa-api-key`       | `EXA_API_KEY`        | collect                    | Create with empty string if unused |

## Optional

| Secret name  | Used by | Notes |
|--------------|---------|-------|
| `REDIS_URL`  | web     | Upstash / Memorystore URL. If omitted, set `_ENABLE_REDIS=false` in Cloud Build substitutions (default). |

## Create with gcloud

```bash
PROJECT_ID="$(gcloud config get-value project)"

# Example — pipe values from your shell (never commit these):
echo -n "$DATABASE_URL"   | gcloud secrets create astra-database-url   --data-file=- --replication-policy=automatic
echo -n "$DIRECT_URL"     | gcloud secrets create astra-direct-url     --data-file=- --replication-policy=automatic
echo -n "$SESSION_SECRET" | gcloud secrets create astra-session-secret --data-file=- --replication-policy=automatic
echo -n "$RESEND_API_KEY" | gcloud secrets create astra-resend-api-key --data-file=- --replication-policy=automatic
echo -n "$OPENAI_API_KEY" | gcloud secrets create astra-openai-api-key --data-file=- --replication-policy=automatic
echo -n "${EXA_API_KEY:-}" | gcloud secrets create astra-exa-api-key   --data-file=- --replication-policy=automatic

# Optional:
# echo -n "$REDIS_URL" | gcloud secrets create REDIS_URL --data-file=- --replication-policy=automatic
```

Update an existing secret version:

```bash
echo -n "$DATABASE_URL" | gcloud secrets versions add astra-database-url --data-file=-
```

## IAM

Grant the Cloud Run runtime SA and Cloud Build SA access to secrets:

```bash
ASTRA_SA="astra-sa@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUDBUILD_SA="cloud-build-sa@${PROJECT_ID}.iam.gserviceaccount.com"

for SECRET in astra-database-url astra-direct-url astra-session-secret astra-resend-api-key astra-openai-api-key astra-exa-api-key; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:${ASTRA_SA}" \
    --role="roles/secretmanager.secretAccessor"
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:${CLOUDBUILD_SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```
