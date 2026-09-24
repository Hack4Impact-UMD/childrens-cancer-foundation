#!/bin/bash

# Builds the React app and zips it for upload to GoDaddy cPanel hosting.
#
# Upload the zip in cPanel File Manager to the portal's document root
# (e.g. public_html/portal), then Extract it there.
#
# Backend (functions, Firestore/Storage rules) still deploys to Firebase:
#   firebase deploy --only functions,firestore,storage
#
# Usage: ./package-godaddy.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/react-app/ccf"
OUT="$ROOT/portal-build.zip"

if [[ ! -f "$APP/src/firebase_config/FireConfig.ts" ]]; then
    echo "Missing react-app/ccf/src/firebase_config/FireConfig.ts (copy FireConfig.example.ts and fill it in)"
    exit 1
fi

cd "$APP"
[[ -d node_modules ]] || npm install
npm run build

if [[ ! -f build/.htaccess ]]; then
    echo "build/.htaccess is missing; page refreshes would 404 on GoDaddy"
    exit 1
fi

rm -f "$OUT"
cd build
zip -qr "$OUT" .
echo "Created $OUT - upload and extract it into the portal's folder in cPanel."
