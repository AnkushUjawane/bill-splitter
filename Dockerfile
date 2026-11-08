# syntax=docker/dockerfile:1

# Bill Splitter: the API (Hono on Cloudflare Workers, run locally by wrangler)
# and the web app (Vite) in one image.
#
#   docker compose up --build                 start everything -> http://localhost:5173
#   docker compose run --rm app pnpm test     run the tests
#
# Debian, not Alpine: workerd (the Workers runtime that wrangler and the tests use) needs glibc.
FROM node:22-bookworm-slim

# The slim image has no CA certificates. workerd (the Workers runtime) refuses to start
# without them: "No CA certificates were loaded from the system".
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pinned, so every build uses the same pnpm. The repo has no "packageManager" field.
ARG PNPM_VERSION=12.16.1
RUN npm install -g pnpm@${PNPM_VERSION}

# Everything below runs as the unprivileged "node" user that comes with the image.
WORKDIR /app
RUN chown node:node /app
USER node

# 1) Dependencies first. Docker reuses this layer until a manifest or the lockfile changes.
#    api/wrangler.jsonc is here because the api's postinstall script runs `wrangler types`.
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node api/package.json api/wrangler.jsonc ./api/
COPY --chown=node:node web/package.json ./web/
RUN pnpm install --frozen-lockfile

# 2) Then the source code (see .dockerignore for what is left out).
COPY --chown=node:node . .

# Regenerate the Worker types now that the source is here. They were first generated during
# the install above, when src/index.ts was not copied yet, and those types miss its exports.
RUN pnpm --filter bill-splitter-api cf-typegen

# The local D1 database lives here. compose.yaml mounts a volume on it, so data survives restarts.
RUN mkdir -p api/.wrangler

ENV WRANGLER_SEND_METRICS=false
EXPOSE 5173 8787

# Healthy when the API answers.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD node -e "fetch('http://localhost:8787/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Same as `pnpm dev`, with one change: both servers listen on 0.0.0.0.
# By default they listen on localhost, which is not reachable from outside a container.
# (pnpm adds the extra flags to the end of each script: `wrangler dev --ip ...` and `vite --host ...`.)
# The API script applies the migrations to the local database first, then starts the API.
CMD ["pnpm", "exec", "concurrently", "-n", "api,web", "-c", "blue,magenta", \
     "pnpm --filter bill-splitter-api dev --ip 0.0.0.0", \
     "pnpm --filter bill-splitter-web dev --host 0.0.0.0"]
