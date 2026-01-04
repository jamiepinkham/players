#!/bin/bash
set -e

# Remove pre-existing pids/server.pid if it exists
if [ -f tmp/pids/server.pid ]; then
  rm -f tmp/pids/server.pid
fi

# Run migrations if needed (uncomment for production deploys)
# bundle exec rails db:migrate

# Start Puma
exec bundle exec puma -C config/puma.rb