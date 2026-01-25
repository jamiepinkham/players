#!/bin/bash
set -e

# Maintenance script for nightly tasks
# Runs at midnight server time

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="bmpl_backup_${TIMESTAMP}.dump"
BACKUP_PATH="/backups/${BACKUP_FILE}"

echo "=================================================="
echo "BMPL Nightly Maintenance - $(date)"
echo "=================================================="
echo ""

# Step 1: Create database backup
echo "📦 Creating database backup..."
pg_dump -U ${DATABASE_USER} -h db -d ${DATABASE_NAME} -F c -b > "${BACKUP_PATH}"

if [ $? -eq 0 ]; then
    echo "✓ Backup created: ${BACKUP_FILE}"
    BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
    echo "  Size: ${BACKUP_SIZE}"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo ""

# Step 2: Run convert_bids task
echo "🔄 Converting leading bids to contracts..."
cd /app
bin/rails convert_bids:convert_leading

if [ $? -eq 0 ]; then
    echo "✓ Bid conversion complete"
else
    echo "❌ Bid conversion failed!"
    exit 1
fi

echo ""

# Step 3: Clean up old backups (keep last 30 days)
echo "🧹 Cleaning up old backups (keeping last 30 days)..."
find /backups -name "bmpl_backup_*.dump" -type f -mtime +30 -delete
REMAINING=$(find /backups -name "bmpl_backup_*.dump" -type f | wc -l)
echo "✓ Cleanup complete (${REMAINING} backups remaining)"

echo ""
echo "=================================================="
echo "Maintenance Complete - $(date)"
echo "=================================================="
