#!/bin/bash
set -e

echo "🧪 Running E2E Smoke Tests..."
npx playwright test --reporter=list
echo "✅ All E2E tests passed!"
