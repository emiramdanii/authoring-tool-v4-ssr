#!/bin/bash
# Start SILSE in sandbox-optimized production mode
cd /home/z/my-project

# Kill any existing server
pkill -f "next start" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 1

# Start production server
export SANDBOX_MODE=1
export NODE_OPTIONS="--max-old-space-size=1024"
exec node node_modules/.bin/next start -p 3000
