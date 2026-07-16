# Astra Collector

Python worker that collects articles from the active news sources, enriches
them with AI (summary, topics, keywords, entities), generates embeddings,
computes a global quality score, **deduplicates** near-identical stories, and
writes everything into the shared Supabase (PostgreSQL) database managed by Prisma
(`packages/database`).

A second job, **`deliver`**, automatically generates and emails personalized
newsletters for users who are due based on their cadence and local send hour.

It is intentionally decoupled from the Next.js app: it talks to the same
database directly and records each run in the `WorkerExecution` table so the
admin dashboard can observe the pipeline.

## Architecture

```
main.py                 # CLI: collect | deliver
  pipeline.py           # per-source: collect -> enrich -> embed -> score -> dedup -> store
    collectors/         # rss.py, scraper.py, exa.py
    enrichment/         # enricher.py (OpenAI + heuristic fallback)
    embeddings/         # embedder.py (OpenAI + hashed fallback)
    scoring/            # global_score.py
    dedup.py            # cosine + URL/title fallback
  delivery/             # ranking, HTML template, Resend send
  repository.py         # SQL data-access against the Prisma schema
  db.py                 # SQLAlchemy engine
  config.py             # env-based settings
```

## Setup

```bash
cd workers/collector
cp .env.example .env          # set Supabase DATABASE_URL (and optionally OPENAI_API_KEY / EXA_API_KEY / RESEND_API_KEY)
python -m venv .venv
. .venv/Scripts/activate      # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -e .
```

Point `DATABASE_URL` at your Supabase project (direct connection, port 5432).
Migrate and seed from the repo root (uses root `.env` with `DATABASE_URL` + `DIRECT_URL`):

```bash
pnpm --filter @workspace/database db:migrate:deploy
pnpm --filter @workspace/database db:seed
```

## Commands

```bash
collector collect    # ingest sources (default if you just run `collector`)
collector deliver    # auto-send due newsletters for this local hour
```

### Suggested cron

| Job | Cadence | Command |
|-----|---------|---------|
| Collect | every 3–6 hours | `collector collect` |
| Deliver | every hour | `collector deliver` |

Deliver selects users where:

- `autoSendEnabled` is true and they have topic preferences
- current local hour matches `sendHour` (in their `timezone`)
- for `WEEKLY`, today matches `weeklySendDay` (0=Sunday … 6=Saturday)
- they have not already received a `SENT` edition for the current day/week window

Without `OPENAI_API_KEY`, the worker uses deterministic heuristic enrichment and
hashed embeddings so the full collect pipeline runs offline. Semantic
deduplication is weak without real embeddings; URL + title normalization still
runs as a safety net.

Without `EXA_API_KEY`, Exa sources are skipped.

Without `RESEND_API_KEY`, `deliver` still creates newsletters and marks them
`SENT` (dev mode), logging that email was skipped.

## Docker

```bash
# From workers/collector
docker build -t astra-collector .
docker run --rm --env-file .env astra-collector collect
docker run --rm --env-file .env astra-collector deliver

# Or from the monorepo root (same Dockerfile)
docker build -f workers/collector/Dockerfile -t astra-collector workers/collector
```

## Deploy GCP

Production runs this image as two **Cloud Run Jobs**, triggered by **Cloud Scheduler**:

| Job | Args | Schedule (default) |
|-----|------|--------------------|
| `astra-collect` | `collector collect` | every 4 hours |
| `astra-deliver` | `collector deliver` | every hour |

See the monorepo deploy docs:

- [deploy/README.md](../../deploy/README.md) — APIs, Artifact Registry, service accounts, secrets, Cloud Build
- [cloudbuild.yaml](../../cloudbuild.yaml) — build, migrate, deploy, scheduler upsert

Set `APP_URL` to the public Cloud Run web URL so tracking links and branding resolve correctly.
