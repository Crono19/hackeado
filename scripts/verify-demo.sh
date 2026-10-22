#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")/.."

DEMO_PORT="${DEMO_PORT:-3107}"
DEMO_URL="http://127.0.0.1:${DEMO_PORT}"
LOG_FILE="${TMPDIR:-/tmp}/hackeado-preflight-$$.log"

cleanup() {
  if [ -n "${SERVER_PID:-}" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

echo "01/04 QUALITY // tipos, lint, unitarias, build"
npm run check

echo "02/04 SERVER // arranque aislado"
HOST=127.0.0.1 PORT="$DEMO_PORT" CLIENT_ORIGIN="$DEMO_URL" npm start >"$LOG_FILE" 2>&1 &
SERVER_PID=$!

ATTEMPT=0
until curl -fsS "$DEMO_URL/api/health" >/dev/null; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -ge 30 ]; then
    echo "ERROR: servidor no respondió. Log: $LOG_FILE"
    exit 1
  fi
  sleep 0.25
done

echo "03/04 STRESS // diez rondas consecutivas"
HACKEADO_URL="$DEMO_URL" npm run verify:ten-rounds

cleanup
SERVER_PID=""

echo "04/04 BROWSER // flujos y responsive"
npm run test:e2e

echo "HACKEADO RC // PREFLIGHT PASS"

