#!/bin/bash
set -e

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

# Run migrations if needed (uncomment for production deploys)
# bundle exec rails db:migrate

# Start all processes with foreman (Rails + asset watchers)
exec foreman start