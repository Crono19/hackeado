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

echo "01/05 QUALITY // tipos, lint, unitarias, build"
npm run check

echo "02/05 SERVER // arranque aislado"
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

echo "03/05 STRESS // diez rondas automáticas consecutivas"
HACKEADO_URL="$DEMO_URL" npm run verify:ten-rounds

cleanup
SERVER_PID=""

echo "04/05 BROWSER // flujos y responsive"
npm run test:e2e

echo "05/05 RELEASE // artefactos, respaldo y configuración"
npm run verify:assets

if command -v dotnet >/dev/null 2>&1 && [ "${OS:-}" = "Windows_NT" ]; then
  dotnet test apps/windows-agent/Hackeado.VictimHost.sln -c Release
else
  echo "WINDOWS // validación C# y publicación pendientes en VM Windows"
fi

echo "HACKEADO RC // PREFLIGHT PASS"

