#!/bin/bash
# ── SILSE Production Server with Keepalive ───────────────────────
# Starts the Next.js production server and keeps it alive.
# Auto-restarts if the process crashes.
# Usage: bash scripts/keep-alive-server.sh
# ────────────────────────────────────────────────────────────────

PORT=${PORT:-8080}
echo "🚀 Starting SILSE production server on port $PORT..."

while true; do
  NODE_ENV=production \
  NODE_OPTIONS='--max-old-space-size=512' \
  node scripts/serve-persistent.mjs &
  
  SERVER_PID=$!
  echo "  Started server PID: $SERVER_PID"
  
  # Wait for server to be ready
  sleep 3
  
  # Keepalive loop - restart if dead
  while true; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "  ⚠️ Server process died. Restarting..."
      break
    fi
    
    # Health check every 10s
    sleep 10
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/ 2>/dev/null)
    if [ "$STATUS" != "200" ]; then
      echo "  ⚠️ Health check failed (HTTP $STATUS). Restarting..."
      kill $SERVER_PID 2>/dev/null
      break
    fi
  done
  
  sleep 2
done
