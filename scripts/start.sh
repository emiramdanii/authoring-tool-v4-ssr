#!/bin/bash
# ── Lightweight Production Start Script ────────────────────────────
# Uses `exec` so the Node process replaces the shell — no shell
# wrapper that could get killed by SIGTERM in container environments.
# ───────────────────────────────────────────────────────────────────

cd /home/z/my-project
exec node node_modules/.bin/next start -p 8080
