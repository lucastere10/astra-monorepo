# Astra Newsletter — local development
#
# Requires GNU Make. On Windows: Git Bash, `choco install make`, or
# `winget install ezwinports.make`.
#
# First run (fully local Docker Postgres + Redis):
#   make setup
#   # in .env, uncomment the Local Docker URLs
#   make infra
#   make db-setup
#   make up
#
# Or keep using Supabase: skip `make infra`, fill DATABASE_URL / DIRECT_URL,
# then `make db-setup` and `make web`.

ifeq ($(OS),Windows_NT)
  PYTHON      ?= py
  VENV_PYTHON := workers/collector/.venv/Scripts/python.exe
  COLLECTOR   := .venv\Scripts\collector.exe
else
  PYTHON      ?= python3
  VENV_PYTHON := workers/collector/.venv/bin/python
  COLLECTOR   := .venv/bin/collector
endif

COMPOSE ?= docker compose
PNPM    ?= pnpm
WEB_URL ?= http://localhost:3000

.DEFAULT_GOAL := help

.PHONY: help setup env install install-worker \
	infra infra-down infra-logs \
	db-setup db-migrate db-seed db-studio \
	up down web collect deliver \
	lint typecheck build

define HELP_TEXT

  Astra - local development

  Setup
    make setup          Copy env files, install JS + Python deps
    make infra          Start Postgres + Redis (Docker)
    make infra-down     Stop containers (volumes kept)
    make infra-logs     Tail container logs
    make db-setup       Migrate + seed
    make db-migrate     Prisma migrate deploy
    make db-seed        Seed topics / sources / admin
    make db-studio      Prisma Studio

  Run
    make up             Infra + Next.js ($(WEB_URL))
    make down           Stop infra
    make web            Next.js only (use with hosted Supabase)
    make collect        Collector ingest job
    make deliver        Newsletter deliver job

  Quality
    make lint           Lint the monorepo
    make typecheck      Typecheck the monorepo
    make build          Production build

endef

help:
	$(info $(HELP_TEXT))
	@exit 0

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

setup: env install install-worker
	$(info )
	$(info   Setup complete.)
	$(info   1. Fill DATABASE_URL, DIRECT_URL, SESSION_SECRET in .env)
	$(info      Uncomment the Local Docker URLs, or paste Supabase strings.)
	$(info   2. make infra          (skip if you use hosted Supabase))
	$(info   3. make db-setup)
	$(info   4. make up             (or: make web))
	$(info )
	@exit 0

env:
ifeq ($(wildcard .env),)
	$(PYTHON) -c "import shutil; shutil.copy('.env.example', '.env')"
	@echo Created .env from .env.example
else
	@echo .env already exists
endif

install:
	$(PNPM) install

install-worker:
	$(PYTHON) -m venv workers/collector/.venv
	"$(VENV_PYTHON)" -m pip install -U pip
	"$(VENV_PYTHON)" -m pip install -e workers/collector

# ---------------------------------------------------------------------------
# Infra (Postgres + Redis)
# ---------------------------------------------------------------------------

infra:
	$(COMPOSE) up -d --wait
	$(info )
	$(info   Postgres  postgresql://astra:astra@127.0.0.1:5432/astra)
	$(info   Redis     redis://127.0.0.1:6379)
	$(info )
	@exit 0

infra-down:
	$(COMPOSE) down

infra-logs:
	$(COMPOSE) logs -f

down: infra-down

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

db-setup: db-migrate db-seed

db-migrate:
	$(PNPM) --filter @workspace/database db:migrate:deploy

db-seed:
	$(PNPM) --filter @workspace/database db:seed

db-studio:
	$(PNPM) --filter @workspace/database db:studio

# ---------------------------------------------------------------------------
# Apps
# ---------------------------------------------------------------------------

up: infra web

web:
	$(info Next.js  $(WEB_URL))
	$(PNPM) --filter web dev

collect:
	cd workers/collector && "$(COLLECTOR)" collect

deliver:
	cd workers/collector && "$(COLLECTOR)" deliver

# ---------------------------------------------------------------------------
# Quality
# ---------------------------------------------------------------------------

lint:
	$(PNPM) lint

typecheck:
	$(PNPM) typecheck

build:
	$(PNPM) build
