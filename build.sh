#!/bin/bash
set -e

# Default build mode = dev
MODE=${1:-dev}

if [ "$MODE" = "dev" ] || [ "$MODE" = "development" ]; then
  echo "🔨 Building DEVELOPMENT image..."
  docker build --no-cache \
    -t zoryon/noxchess-client:dev \
    --build-arg BUILD_ENV=development \
    .
elif [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
  echo "🔨 Building PRODUCTION image..."
  docker build --no-cache \
    -t zoryon/noxchess-client:production \
    --build-arg BUILD_ENV=production \
    .
else
  echo "❌ Unknown mode: $MODE"
  echo "Usage: $0 [dev|prod]"
  exit 1
fi
