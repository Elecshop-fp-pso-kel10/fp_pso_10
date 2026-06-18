#!/usr/bin/env bash
# run-smoke-tests.sh
# Usage:
#   ./run-smoke-tests.sh                             # default: http://localhost:4000
#   BASE_URL=http://staging.elecshop.com ./run-smoke-tests.sh
#   BASE_URL=http://localhost:4000 \
#     ADMIN_EMAIL=admin@elecshop.com \
#     ADMIN_PASSWORD=supersecret \
#     ./run-smoke-tests.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Elecshop API — Smoke Test Runner"
echo "  Target: ${BASE_URL:-http://localhost:4000}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

export BASE_URL="${BASE_URL:-http://localhost:4000}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@elecshop.com}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin_password}"

npx jest --config jest.smoke.json --runInBand "$@"
