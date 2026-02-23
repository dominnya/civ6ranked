FROM oven/bun:1.3.9 AS base
WORKDIR /app

# --- Install dependencies ---
FROM base AS install
COPY package.json bun.lock ./
COPY apps/*/package.json apps/*/package.json
RUN bun install --ignore-scripts

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
