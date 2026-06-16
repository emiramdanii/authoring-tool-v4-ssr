#!/bin/bash
set -e

cd /home/z/my-project

# Kill any existing server
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Start server
NODE_OPTIONS="--max-old-space-size=512" SANDBOX_MODE=1 npx next dev -p 3000 > /tmp/nextjs.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://21.0.22.43:3000/ 2>/dev/null | grep -q "200"; then
    echo "Server is up after ${i}s"
    break
  fi
  sleep 1
done

# Run Playwright test
echo "Running Playwright test..."
node /home/z/my-project/test-results/overlap-test.mjs 2>&1

# Kill server
kill $SERVER_PID 2>/dev/null || true
