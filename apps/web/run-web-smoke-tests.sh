#!/usr/bin/env bash
# run-web-smoke-tests.sh
# Usage:
#   ./run-web-smoke-tests.sh
#   WEB_URL=https://staging.elecshop.com \
#     TEST_USER_EMAIL=smoke@elecshop.test \
#     TEST_USER_PASSWORD=smoke_pass_123 \
#     ADMIN_EMAIL=admin@elecshop.com \
#     ADMIN_PASSWORD=supersecret \
#     ./run-web-smoke-tests.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Elecshop Web — Smoke Test Runner"
echo "  Target: ${WEB_URL:-http://localhost:3000}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

export WEB_URL="${WEB_URL:-http://localhost:3000}"
export TEST_USER_EMAIL="${TEST_USER_EMAIL:-smoke@elecshop.test}"
export TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-smoke_pass_123}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@elecshop.com}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin_password}"

# Install Playwright browsers if not already installed
npx playwright install chromium --with-deps 2>/dev/null || true

npx playwright test --config playwright.config.ts "$@"
