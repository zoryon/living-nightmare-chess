FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_WEBSOCKET_URL
ARG DATABASE_URL
ARG JWT_ACCESS_SECRET
ARG JWT_REFRESH_SECRET
ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
ENV JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
# Generate Prisma client (no DB pull); then build Next
RUN pnpm dlx prisma generate && pnpm exec next build

FROM node:20-alpine AS runner
WORKDIR /app
RUN adduser -D nextjs
USER nextjs
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./package.json
CMD ["pnpm", "start"]
