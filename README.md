# Astra Newsletter

**Astra** ranks technology signal to your interests and delivers it as a personalized newsletter — intelligence first, inbox second.

Monorepo with:

| Path | Role |
|------|------|
| `apps/web` | Next.js app (landing, auth, dashboard, admin) |
| `workers/collector` | Python worker (collect → enrich → score → deliver) |
| `packages/database` | Prisma schema + migrations (Supabase Postgres) |
| `packages/shared` | Shared types, topics, branding, scoring |
| `packages/ui` | shadcn/ui components |
| `deploy/` | Cloud Run / Scheduler / Cloud Build docs |

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 10+
- Python 3.11+ (worker)
- A Supabase (PostgreSQL) project

## Setup

```bash
# From the repo root
cp .env.example .env
# Fill DATABASE_URL, DIRECT_URL, SESSION_SECRET at minimum.
# Optional: RESEND_API_KEY, OPENAI_API_KEY, EXA_API_KEY, REDIS_URL

pnpm install

pnpm --filter @workspace/database db:migrate:deploy
pnpm --filter @workspace/database db:seed
```

Set `ADMIN_EMAIL` in `.env` before seeding if you want a first admin user.

## Run the web app

```bash
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `RESEND_API_KEY`, magic-link emails are logged to the server console.

## Run the collector worker

Uses the same root `.env` as the web app (reads `DIRECT_URL` for Postgres).

```bash
make collect    # ingest + enrich sources
make deliver    # generate/send due newsletters
```

Or manually:

```bash
cd workers/collector
python -m venv .venv
# Windows PowerShell:
. .venv\Scripts\Activate.ps1
pip install -e .

collector collect
collector deliver
```

See [workers/collector/README.md](workers/collector/README.md) for architecture and cron suggestions.

## Useful scripts

```bash
pnpm build                         # turbo build
pnpm typecheck                     # turbo typecheck
pnpm --filter @workspace/database db:studio
```

## Deploy

Production targets GCP Cloud Run (`astra-web`, `astra-collect`, `astra-deliver`). See [deploy/README.md](deploy/README.md) and root [`cloudbuild.yaml`](cloudbuild.yaml).
