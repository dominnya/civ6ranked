FROM oven/bun:1.3.9 AS base
WORKDIR /app

# --- Install dependencies ---
FROM base AS install
COPY package.json bun.lock ./
COPY apps apps

RUN bun install --cwd . --ignore-scripts
RUN bun install --cwd apps/discord --ignore-scripts
RUN bun install --cwd apps/backend --ignore-scripts

# --- Release ---
FROM base AS release
COPY --from=install /app/node_modules node_modules
COPY package.json bun.lock turbo.json tsconfig.json ./
COPY apps apps

ARG PORT=1212
ENV NODE_ENV=production
ENV PORT=$PORT
EXPOSE $PORT

CMD ["bun", "run", "start:headless"]
