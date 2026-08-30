# Astra Newsletter

**Astra** ranks technology signal to your interests and delivers it as a personalized newsletter — intelligence first, inbox second.

Monorepo with:

| Path | Role |
|------|------|
| `apps/web` | Next.js app (landing, auth, dashboard, admin) |
| `workers/collector` | Python worker (collect → enrich → score → deliver) |
| `packages/database` | Prisma schema + migrations (Postgres) |
| `packages/shared` | Shared types, topics, branding, scoring |
| `packages/ui` | shadcn/ui components |
| `deploy/` | Cloud Run / Scheduler / Cloud Build docs |

## Prerequisites

- [GNU Make](https://www.gnu.org/software/make/) — on Windows: Git Bash, `choco install make`, or `winget install ezwinports.make`
- Node.js 20+
- [pnpm](https://pnpm.io/) 10+
- Python 3.11+ (collector worker)
- [Docker](https://docs.docker.com/get-docker/) (for local Postgres + Redis)

Make is the supported way to run the stack locally. Targets work on macOS, Linux, and Windows (Git Bash / PowerShell with `make` on `PATH`).

## Run locally

Two database options: **fully local Docker** (Postgres + Redis) or **hosted Supabase**.

### Fully local (Docker)

```bash
make setup
# In .env: uncomment the Local Docker DATABASE_URL / DIRECT_URL pair
# and set SESSION_SECRET (openssl rand -base64 32).
make infra
make db-setup
make up
```

`make up` starts Postgres + Redis and then the Next.js app at [http://localhost:3000](http://localhost:3000).

Stop infra with `make down` (volumes are kept).

### Hosted Supabase

Skip Docker. Fill `DATABASE_URL` and `DIRECT_URL` in `.env` with the Supabase connection strings, then:

```bash
make setup
make db-setup
make web
```

Set `ADMIN_EMAIL` in `.env` before `make db-setup` if you want a first admin user.

Without `RESEND_API_KEY`, magic-link emails are logged to the server console.

## Makefile targets

```text
Setup
  make setup          Copy .env, install JS + Python deps
  make infra          Start Postgres + Redis (Docker)
  make infra-down     Stop containers (volumes kept)
  make infra-logs     Tail container logs
  make db-setup       Migrate + seed
  make db-migrate     Prisma migrate deploy
  make db-seed        Seed topics / sources / admin
  make db-studio      Prisma Studio

Run
  make up             Infra + Next.js (http://localhost:3000)
  make down           Stop infra
  make web            Next.js only (use with hosted Supabase)
  make collect        Collector ingest job
  make deliver        Newsletter deliver job

Quality
  make lint           Lint the monorepo
  make typecheck      Typecheck the monorepo
  make build          Production build
```

`make` with no arguments prints this list (`make help`).

## Collector worker

Uses the same root `.env` as the web app (`DIRECT_URL` for Postgres). After `make setup`:

```bash
make collect    # ingest + enrich sources
make deliver    # generate/send due newsletters
```

Without `OPENAI_API_KEY`, enrichment falls back to heuristics. Without `RESEND_API_KEY`, `deliver` still creates editions and logs that email was skipped.

See [workers/collector/README.md](workers/collector/README.md) for architecture and cron suggestions.

## Environment

Copy happens automatically via `make setup` (`cp .env.example .env`). Minimum:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled Postgres URL (web app) |
| `DIRECT_URL` | Direct Postgres URL (Prisma + collector) |
| `SESSION_SECRET` | 32+ char secret for session JWTs |

Optional: `REDIS_URL`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `EXA_API_KEY`, `ADMIN_EMAIL`. Local Docker URLs are commented in `.env.example`.

## Deploy

Production targets GCP Cloud Run (`astra-web`, `astra-collect`, `astra-deliver`). See [deploy/README.md](deploy/README.md) and root [`cloudbuild.yaml`](cloudbuild.yaml).
