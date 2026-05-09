#!/bin/bash
# Double-fork daemon for Next.js standalone server
# This ensures the process survives session termination

cd /home/z/my-project/authoring-tool-v4-ssr
export NEXT_TELEMETRY_DISABLED=1
export HOSTNAME=0.0.0.0
export PORT=3000

# Ensure build exists
if [ ! -f .next/standalone/server.js ]; then
  npx next build > /tmp/next-build.log 2>&1
fi

# Copy static files to standalone (required for standalone output)
if [ ! -d .next/standalone/.next/static ] || [ "$(find .next/static -newer .next/standalone/.next/static -prune -print -quit 2>/dev/null)" ]; then
  rm -rf .next/standalone/.next/static
  cp -r .next/static .next/standalone/.next/static
  echo "[$(date)] Synced static files to standalone" >> /tmp/next-daemon.log
fi

# Self-restart loop
while true; do
  echo "[$(date)] Starting Next.js..." >> /tmp/next-daemon.log
  node .next/standalone/server.js >> /tmp/next-daemon.log 2>&1
  EXIT=$?
  echo "[$(date)] Next.js exited ($EXIT), restarting in 3s..." >> /tmp/next-daemon.log
  sleep 3
done
