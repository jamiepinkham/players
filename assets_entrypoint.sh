#!/bin/bash
set -euo pipefail

cd /app

if [ ! -x ./node_modules/.bin/esbuild ] || [ ! -x ./node_modules/.bin/sass ]; then
  echo "node_modules missing or wrong platform; installing in-container..."
  rm -rf node_modules
  yarn install --frozen-lockfile
fi

SASS="./node_modules/.bin/sass"
ESBUILD="./node_modules/.bin/esbuild"

OUTDIR="app/assets/builds"
mkdir -p "$OUTDIR"

# Start sass in background -> builds/application.css
"$SASS" app/assets/stylesheets/application.scss:"$OUTDIR/application.css" \
  --load-path=node_modules \
  --watch &

# Start esbuild in foreground -> builds/*
exec "$ESBUILD" app/javascript/application.jsx \
  --bundle \
  --sourcemap \
  --outdir="$OUTDIR" \
  --loader:.js=jsx \
  --loader:.jsx=jsx \
  --loader:.woff2=file \
  --loader:.woff=file \
  --loader:.ttf=file \
  --loader:.eot=file \
  --loader:.svg=file \
  --loader:.jpg=file \
  --asset-names=images/[name]-[hash] \
  --public-path=/assets \
  --watch=forever
