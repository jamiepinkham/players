#!/bin/bash
set -e

# Start sass in background
sass app/assets/stylesheets/application.scss:public/assets/application.css \
  --load-path=node_modules \
  --watch &

# Start esbuild in foreground
exec esbuild app/javascript/application.jsx \
  --bundle \
  --sourcemap \
  --outdir=public/assets \
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
