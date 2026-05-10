#!/bin/bash
cd /home/z/my-project/authoring-tool-v4-ssr
export PORT=3000
export HOSTNAME=0.0.0.0
while true; do
  echo "$(date): Starting standalone server..." >> /tmp/next-daemon.log
  node .next/standalone/server.js >> /tmp/next.log 2>&1
  EXIT=$?
  echo "$(date): Server exited code=$EXIT, restarting in 3s..." >> /tmp/next-daemon.log
  sleep 3
done
