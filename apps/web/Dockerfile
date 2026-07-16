# Astra web — build from the monorepo root:
#   docker build -f apps/web/Dockerfile -t astra-web .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app

FROM base AS deps
# Dummy URLs so prisma generate / postinstall succeed without a real DB.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/typescript-config ./packages/typescript-config
COPY packages/eslint-config ./packages/eslint-config

# Satisfy dotenv-cli paths used by package scripts / postinstall.
RUN printf '%s\n' \
      'DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public' \
      'DIRECT_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public' \
      > .env

COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/src ./packages/database/src
COPY packages/database/tsconfig.json ./packages/database/

RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}" \
    SESSION_SECRET="build-time-placeholder-not-used-at-runtime"

COPY --from=deps /app /app
COPY . .

RUN printf '%s\n' \
      'DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public' \
      'DIRECT_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public' \
      "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" \
      'SESSION_SECRET=build-time-placeholder-not-used-at-runtime' \
      > .env

RUN pnpm --filter @workspace/database exec prisma generate
# Bypass dotenv -e ../../.env so the image build does not require a real .env file.
RUN pnpm --filter web exec next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
