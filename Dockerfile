# syntax=docker/dockerfile:1

FROM node:20-bullseye-slim AS base
WORKDIR /workspace
ENV YARN_CACHE_FOLDER=/tmp/yarn-cache
RUN apt-get update \
  && apt-get install -y --no-install-recommends bash openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json yarn.lock ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
COPY apps/client/package.json apps/client/
RUN yarn install --frozen-lockfile

FROM deps AS backend-build
COPY . .
RUN yarn workspace @macro-calculator/shared build \
  && yarn workspace @macro-calculator/server build

FROM deps AS frontend-build
COPY . .
RUN yarn workspace @macro-calculator/client build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    SERVER_PORT=4000 \
    DATABASE_URL=file:./prisma/data/dev.db
RUN apt-get update \
  && apt-get install -y --no-install-recommends bash openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock ./
RUN node -e "const fs=require('fs');const pkg=require('./package.json');pkg.workspaces=['apps/server','packages/shared'];fs.writeFileSync('package.json', JSON.stringify(pkg));"
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
RUN yarn install --frozen-lockfile --production --non-interactive && yarn cache clean

COPY --from=backend-build /workspace/apps/server/dist ./apps/server/dist
COPY --from=backend-build /workspace/packages/shared/dist ./packages/shared/dist
COPY --from=frontend-build /workspace/apps/client/dist ./apps/client/dist
COPY prisma ./prisma

RUN npx prisma generate --schema prisma/schema.prisma

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node apps/server/dist/server.js"]
