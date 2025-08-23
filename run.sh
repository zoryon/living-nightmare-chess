#!/bin/bash
set -e

# Default mode = dev
MODE=${1:-dev}

# Prefer a Docker-specific env file when present
ENV_FILE=.env
if [ -f .env.docker ]; then
  ENV_FILE=.env.docker
fi

if [ "$MODE" = "dev" ] || [ "$MODE" = "development" ]; then
  echo "🚀 Starting container in DEVELOPMENT mode... (env: $ENV_FILE)"
  docker run --rm --env-file "$ENV_FILE" -p 3000:3000 zoryon/noxchess-client:dev
elif [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
  echo "🚀 Starting container in PRODUCTION mode... (env: $ENV_FILE)"
  docker run -d --env-file "$ENV_FILE" -p 3000:3000 zoryon/noxchess-client:prod
else
  echo "❌ Unknown mode: $MODE"
  echo "Usage: $0 [dev|prod]"
  exit 1
fi