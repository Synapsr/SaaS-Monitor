# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN corepack enable

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY . .
# APP_URL: base of the absolute URLs of social previews, written into the pages at build time.
# BUILD_ID: identifies the build; open wall displays reload themselves when it changes.
ARG APP_URL BUILD_ID
ENV APP_URL=${APP_URL} BUILD_ID=${BUILD_ID} STANDALONE_BUILD=true
RUN mkdir -p public && pnpm build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Migrations are applied by the server on startup (see src/instrumentation.ts).
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --chown=nextjs:nodejs LICENSE ./
USER nextjs
EXPOSE 3000
# On the port the server listens on: hosts such as EasyPanel set their own PORT.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
