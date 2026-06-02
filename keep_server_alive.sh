#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS='--max-old-space-size=768' node node_modules/.bin/next start -p 3000 2>&1
  sleep 1
done
