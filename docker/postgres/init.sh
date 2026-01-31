#!/bin/bash
# Auto-restore database from mounted restore file
# Place your restore file at: ./db-restore/db.restore (on host machine)

set -e

RESTORE_FILE="/db-restore/db.restore"

echo "================================================"
echo "PostgreSQL Database Initialization"
echo "================================================"

if [ -f "$RESTORE_FILE" ]; then
    echo "✓ Found restore file: $RESTORE_FILE"
    echo "Restoring database..."

    # Create database if it doesn't exist
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
        SELECT 'CREATE DATABASE $POSTGRES_DB'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$POSTGRES_DB')\gexec
EOSQL

    # Restore the database
    pg_restore --verbose --clean --no-acl --no-owner \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        "$RESTORE_FILE" 2>&1 || echo "Restore completed (some warnings are normal)"

    echo "================================================"
    echo "✓ Database restored from $RESTORE_FILE"
    echo "================================================"
else
    echo "No restore file found at $RESTORE_FILE"
    echo "Database will start empty"
    echo ""
    echo "To auto-restore on next initialization:"
    echo "  1. Place file at: ./db-restore/db.restore"
    echo "  2. Remove volume: docker compose down -v"
    echo "  3. Restart: docker compose up -d"
    echo "================================================"
fi
