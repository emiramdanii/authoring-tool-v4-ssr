#!/bin/bash
# Standalone server launcher with respawn capability
# Saves PID for tracking, auto-restarts on crash

DIR="/home/z/my-project"
PID_FILE="$DIR/.server.pid"
LOG_FILE="$DIR/dev.log"
PORT=3000

# Kill previous instance
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    kill -9 "$OLD_PID" 2>/dev/null
    # Kill children too
    pkill -P "$OLD_PID" 2>/dev/null
    rm -f "$PID_FILE"
fi

# Wait for port to free
sleep 2

# Start standalone server
cd "$DIR"
export PORT=3000
export HOSTNAME=0.0.0.0

# Use setsid to create new session - survives parent death
setsid node .next/standalone/server.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

echo "Standalone server PID: $SERVER_PID"

# Wait for ready
for i in $(seq 1 30); do
    if curl -s -m 2 -4 -o /dev/null http://127.0.0.1:$PORT 2>/dev/null; then
        echo "Server ready on port $PORT!"
        exit 0
    fi
    sleep 1
done

echo "Timeout waiting for server"
exit 1
