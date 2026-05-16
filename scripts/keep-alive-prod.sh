#!/bin/bash
# Keep-alive script for Next.js production server
# Restarts automatically if server dies

PORT=8080
MAX_RESTARTS=50
RESTART_COUNT=0

echo "[$(date)] Starting keep-alive for Next.js production on port $PORT"

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
  echo "[$(date)] Starting Next.js (attempt $((RESTART_COUNT+1))/$MAX_RESTARTS)..."
  
  NODE_ENV=production NODE_OPTIONS='--max-old-space-size=384' node node_modules/.bin/next start -p $PORT &
  SERVER_PID=$!
  
  # Wait for server to be ready
  sleep 3
  
  # Check if process still alive
  if kill -0 $SERVER_PID 2>/dev/null; then
    echo "[$(date)] Server running (PID $SERVER_PID)"
    
    # Monitor loop
    while kill -0 $SERVER_PID 2>/dev/null; do
      sleep 5
    done
    
    echo "[$(date)] Server died (PID $SERVER_PID)"
  else
    echo "[$(date)] Server failed to start"
  fi
  
  RESTART_COUNT=$((RESTART_COUNT+1))
  sleep 2
done

echo "[$(date)] Max restarts reached. Exiting."
