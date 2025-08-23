# ------------------------------
# Base image
# ------------------------------
FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV COREPACK_DEFAULT_TO_LATEST=0
RUN apk add --no-cache libc6-compat

# ------------------------------
# Dependencies (for building)
# ------------------------------
FROM base AS deps
# Keep dev deps here (build needs them)
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN set -eux; \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else echo "Lockfile not found." >&2; exit 1; \
  fi

# ------------------------------
# Build
# ------------------------------
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build Next.js (standalone)
RUN set -eux; \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "No lockfile found for build." >&2; exit 1; \
  fi

# ------------------------------
# Production runtime (small)
# ------------------------------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Only copy what the standalone server needs
# Use --chown to avoid a separate chown layer later
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
CMD ["node", "server.js"]


# ------------------------------
# Optional: Dev target (for docker compose/dev containers)
# Build with: docker build --target dev -t app-dev .
# Run with:   docker run -p 3000:3000 app-dev
# ------------------------------
FROM base AS dev
ENV NODE_ENV=development
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN set -eux; \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else echo "Lockfile not found." >&2; exit 1; \
  fi
COPY . .
EXPOSE 3000
CMD [ "sh", "-c", "\
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && exec pnpm run dev; \
  elif [ -f yarn.lock ]; then exec yarn dev; \
  else exec npm run dev; \
  "]