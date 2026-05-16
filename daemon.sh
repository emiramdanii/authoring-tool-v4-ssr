#!/bin/bash
# SILSE daemon — keeps server alive
cd /home/z/my-project/.next/standalone
export PORT=8080
export HOSTNAME=0.0.0.0
while true; do
  node server.js
  sleep 2
done
