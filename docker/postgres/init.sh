#!/bin/bash
set -e

# Only run in development
if [[ "$RAILS_ENV" != "development" ]]; then
  echo "ℹ️ Skipping DB setup: not in development environment."
  exit 0
fi

echo "🕒 Waiting for Postgres to be ready..."
until pg_isready -U "$DATABASE_USER" -h localhost >/dev/null 2>&1; do
  sleep 1
done

# Path relative to the app context inside the container
SEED_FILE="db/restore/latest.restore"

if [[ -f "$SEED_FILE" ]]; then
  echo "📦 Seed restore found at $SEED_FILE, restoring..."

  # Wait for app container to be ready to run this
  docker compose run --rm players bash -c "
    bundle exec rails db:create &&
    pg_restore --clean --no-owner -U \$DATABASE_USER -d \$DATABASE_NAME < $SEED_FILE
    bundle exec rails db:migrate
  "
else
  echo "🧱 No seed dump found. Falling back to Rails setup..."
  docker compose run --rm players bundle exec rails db:create db:migrate db:seed
fi

echo "✅ DB setup complete."
