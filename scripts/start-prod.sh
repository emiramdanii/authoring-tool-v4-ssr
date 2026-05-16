#!/bin/bash
# SILSE Production Server — Auto-restart daemon
# Runs the standalone Next.js server, restarting on crash

cd /home/z/my-project/.next/standalone
export PORT=8080
export HOSTNAME=0.0.0.0

while true; do
  NODE_OPTIONS='--max-old-space-size=384' node server.js
  EXIT=$?
  echo "[$(date)] Server exited with code $EXIT, restarting in 2s..." >> /tmp/silse-daemon.log
  sleep 2
done
