#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")/.."

npm run build
mkdir -p release

ARCHIVE="$(pwd)/release/HACKEADO-offline-0.1.0-macos.tar.gz"
STAGING="$(mktemp -d)"
BUNDLE="$STAGING/HACKEADO"
trap 'rm -rf "$STAGING"' EXIT INT TERM

mkdir -p "$BUNDLE"
cp .env.example .nvmrc README.md package.json package-lock.json "$BUNDLE/"
cp -R dist public scenarios scripts docs "$BUNDLE/"

echo "OFFLINE RUNTIME // instalando dependencias de producción desde caché local"
npm ci --omit=dev --ignore-scripts --offline --prefix "$BUNDLE"

COPYFILE_DISABLE=1 tar -C "$STAGING" -czf "$ARCHIVE" HACKEADO

echo "OFFLINE PACKAGE // $ARCHIVE"
echo "Extraer, copiar .env.example a .env y ejecutar: sh scripts/start-demo.sh"
