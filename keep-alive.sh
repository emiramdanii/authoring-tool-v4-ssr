#!/bin/bash
cd /home/z/my-project/authoring-tool-v4-ssr

# Start Next.js
start_next() {
  pkill -f "next start" 2>/dev/null
  sleep 1
  npx next start -p 3000 >> /tmp/next.log 2>&1 &
  sleep 3
}

# Start Caddy
start_caddy() {
  pkill -f "caddy reverse" 2>/dev/null
  sleep 1
  caddy reverse-proxy --from :8080 --to localhost:3000 >> /tmp/caddy.log 2>&1 &
  sleep 2
}

# Initial start
start_next
start_caddy

# Monitor loop
while true; do
  if ! curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "$(date): Next.js down, restarting..." >> /tmp/keep-alive.log
    start_next
    start_caddy
  elif ! curl -s -o /dev/null http://localhost:8080/ 2>/dev/null; then
    echo "$(date): Caddy down, restarting..." >> /tmp/keep-alive.log
    start_caddy
  fi
  sleep 5
done
