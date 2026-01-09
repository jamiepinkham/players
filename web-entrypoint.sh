#!/bin/bash
set -e

# Signal handling to gracefully shutdown foreman
# This works around a Ruby 3.1/RubyGems signal handling bug
_term() {
  echo "Caught SIGTERM signal, shutting down gracefully..."
  kill -TERM "$child" 2>/dev/null || true
  wait "$child"
  exit 0
}

_int() {
  echo "Caught SIGINT signal, shutting down gracefully..."
  kill -INT "$child" 2>/dev/null || true
  wait "$child"
  exit 0
}

trap _term SIGTERM
trap _int SIGINT

# Remove pre-existing pids/server.pid if it exists
if [ -f tmp/pids/server.pid ]; then
  rm -f tmp/pids/server.pid
fi

# Install JavaScript dependencies
echo "Installing JavaScript dependencies..."
yarn install

# Build assets initially
echo "Building assets..."
mkdir -p app/assets/builds
yarn build
yarn build:css

# Copy esbuild-hashed image files to public/ so they're accessible directly
echo "Copying esbuild image assets to public/..."
mkdir -p public
cp app/assets/builds/*.jpg public/ 2>/dev/null || true
cp app/assets/builds/*.png public/ 2>/dev/null || true
cp app/assets/builds/*.gif public/ 2>/dev/null || true
cp app/assets/builds/*.svg public/ 2>/dev/null || true

# Precompile Rails assets for production (copies to public/ and creates manifest)
if [ "$RAILS_ENV" = "production" ]; then
  echo "Precompiling Rails assets for production..."
  bundle exec rails assets:precompile
fi

# Run migrations if needed (uncomment for production deploys)
# bundle exec rails db:migrate

# Start all processes with foreman (Rails + asset watchers)
# Run in background and wait to allow signal trapping
foreman start &
child=$!
wait "$child"