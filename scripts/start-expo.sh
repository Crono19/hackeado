#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: falta .env de exposición. Copia .env.example y configura TLS + agente."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "ERROR: dependencias ausentes. Usa paquete offline o ejecuta npm ci."
  exit 1
fi

if [ ! -f dist/client/index.html ] || [ ! -f dist/server/server/index.js ]; then
  echo "BUILD // preparando versión candidata"
  npm run build
fi

exec node scripts/start-expo.mjs
