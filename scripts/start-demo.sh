#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "ERROR: dependencias ausentes. Usa paquete offline o ejecuta npm ci."
  exit 1
fi

if [ ! -f dist/client/index.html ] || [ ! -f dist/server/server/index.js ]; then
  echo "BUILD // preparando versión de producción"
  npm run build
fi

echo "HACKEADO // iniciando estación en http://${HOST:-0.0.0.0}:${PORT:-3000}"
exec npm start

