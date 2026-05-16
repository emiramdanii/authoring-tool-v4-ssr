#!/bin/bash
# ── Lightweight Next.js Server with Auto-Restart ────────────────
# Keeps the production server alive with auto-restart on crash.
# Uses minimal memory footprint.
# ────────────────────────────────────────────────────────────────

PORT=8080
MAX_RESTARTS=10
RESTART_COUNT=0
RESTART_DELAY=3

echo "🔄 Starting SILSE production server on port $PORT..."

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
  echo "  Starting (attempt $((RESTART_COUNT + 1))/$MAX_RESTARTS)..."
  
  NODE_ENV=production \
  NODE_OPTIONS='--max-old-space-size=512' \
  npx next start -p $PORT
  
  EXIT_CODE=$?
  echo "  Server exited with code $EXIT_CODE"
  
  RESTART_COUNT=$((RESTART_COUNT + 1))
  
  if [ $RESTART_COUNT -lt $MAX_RESTARTS ]; then
    echo "  Restarting in ${RESTART_DELAY}s..."
    sleep $RESTART_DELAY
  fi
done

echo "❌ Max restarts reached. Stopping."
