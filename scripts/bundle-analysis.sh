#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# BUNDLE ANALYSIS — Runs Next.js build with bundle analyzer
# ═══════════════════════════════════════════════════════════════
# Usage:
#   ./scripts/bundle-analysis.sh          # Client + Server analysis
#   ./scripts/bundle-analysis.sh client   # Client bundle only
#   ./scripts/bundle-analysis.sh server   # Server bundle only
#
# Output: Opens browser with interactive treemap visualization
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-both}"

case "$MODE" in
  client)
    export ANALYZE=true
    export BUNDLE_ANALYZE_MODE=client
    echo "📊 Analyzing CLIENT bundle..."
    ;;
  server)
    export ANALYZE=true
    export BUNDLE_ANALYZE_MODE=server
    echo "📊 Analyzing SERVER bundle..."
    ;;
  both|*)
    export ANALYZE=true
    echo "📊 Analyzing BOTH client + server bundles..."
    ;;
esac

echo "─────────────────────────────────────────"
echo "Running: ANALYZE=true next build"
echo "─────────────────────────────────────────"

# Run the build with analyzer enabled
bun run build 2>&1 || npx next build 2>&1

echo ""
echo "✅ Bundle analysis complete!"
echo "   Check the browser windows that opened automatically."
echo ""
echo "   If no browser opened, check for generated HTML files:"
echo "   - .next/analyze/client.html"
echo "   - .next/analyze/server.html"
echo "   - .next/analyze/nodejs.html"
