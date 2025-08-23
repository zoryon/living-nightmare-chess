#!/bin/bash
set -e

# Default mode = dev
MODE=${1:-dev}

if [ "$MODE" = "dev" ] || [ "$MODE" = "development" ]; then
  echo "🚀 Starting container in DEVELOPMENT mode..."
  docker run --rm --env-file .env -p 3000:3000 zoryon/noxchess-client:dev
elif [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
  echo "🚀 Starting container in PRODUCTION mode..."
  docker run -d --env-file .env -p 3000:3000 zoryon/noxchess-client:prod
else
  echo "❌ Unknown mode: $MODE"
  echo "Usage: $0 [dev|prod]"
  exit 1
fi