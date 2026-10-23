#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")/.."

npm run build
mkdir -p release

VERSION="$(node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version")"
RELEASE_DIR="$(pwd)/release"
ARCHIVE_NAME="HACKEADO-offline-${VERSION}-macos.tar.gz"
ARCHIVE="$RELEASE_DIR/$ARCHIVE_NAME"
STAGING="$(mktemp -d)"
BUNDLE="$STAGING/HACKEADO"
trap 'rm -rf "$STAGING"' EXIT INT TERM

mkdir -p "$BUNDLE"
cp .env.example .env.expo.example .nvmrc README.md package.json package-lock.json "$BUNDLE/"
cp -R dist public scenarios scripts docs config "$BUNDLE/"

if [ -d release/windows-agent ]; then
  mkdir -p "$BUNDLE/windows-agent"
  for artifact in release/windows-agent/*.zip release/windows-agent/*.sha256; do
    if [ -f "$artifact" ]; then cp "$artifact" "$BUNDLE/windows-agent/"; fi
  done
fi

echo "OFFLINE RUNTIME // instalando dependencias de producción desde caché local"
npm ci --omit=dev --ignore-scripts --offline --prefix "$BUNDLE"

COPYFILE_DISABLE=1 tar -C "$STAGING" -czf "$ARCHIVE" HACKEADO
(cd "$RELEASE_DIR" && shasum -a 256 "$ARCHIVE_NAME" >"$ARCHIVE_NAME.sha256")

echo "OFFLINE PACKAGE // $ARCHIVE"
echo "SHA256 // $ARCHIVE.sha256"
echo "Expo live: extraer, crear .env y ejecutar sh scripts/start-expo.sh"
