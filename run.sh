#!/bin/bash
set -e

# Default mode = dev
MODE=${1:-dev}

# Extract and sanitize key env vars to avoid quoted values in container
if [ -f .env ]; then
  RAW_DB=$(grep -E '^[[:space:]]*DATABASE_URL=' .env | tail -n1 | cut -d= -f2-)
  RAW_WS=$(grep -E '^[[:space:]]*WEBSOCKET_PORT=' .env | tail -n1 | cut -d= -f2-)
else
  RAW_DB=""
  RAW_WS=""
fi
SANITIZED_DB=$(printf '%s' "${RAW_DB}" | tr -d '"' | tr -d "'")
SANITIZED_WS=$(printf '%s' "${RAW_WS}" | tr -d '"' | tr -d "'")
if ! [[ "$SANITIZED_WS" =~ ^[0-9]+$ ]]; then
  SANITIZED_WS=3001
fi

if [ "$MODE" = "dev" ] || [ "$MODE" = "development" ]; then
  echo "🚀 Starting container in DEVELOPMENT mode..."
  docker run --rm --env-file .env \
    -e DATABASE_URL="${SANITIZED_DB}" -e WEBSOCKET_PORT=${SANITIZED_WS} \
    -p 3000:3000 zoryon/noxchess-client:dev
elif [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
  echo "🚀 Starting container in PRODUCTION mode..."
  docker run -d --env-file .env \
    -e DATABASE_URL="${SANITIZED_DB}" -e WEBSOCKET_PORT=${SANITIZED_WS} \
    -p 3000:3000 zoryon/noxchess-client:prod
else
  echo "❌ Unknown mode: $MODE"
  echo "Usage: $0 [dev|prod]"
  exit 1
fi