#!/bin/bash
# Quick script to check production database configuration
# Usage: ./check-prod-db.sh [server] [container]
#   or set PROD_SERVER and PROD_CONTAINER environment variables

set -e

# Use arguments or environment variables or defaults
PROD_SERVER="${1:-${PROD_SERVER:-user@hostname}}"
PROD_CONTAINER="${2:-${PROD_CONTAINER:-players-db-1}}"

if [ "$PROD_SERVER" = "user@hostname" ]; then
  echo "Error: Please specify production server"
  echo ""
  echo "Usage:"
  echo "  $0 user@hostname [container]"
  echo ""
  echo "Or set environment variables:"
  echo "  export PROD_SERVER=user@hostname"
  echo "  export PROD_CONTAINER=players-db-1"
  echo "  $0"
  echo ""
  exit 1
fi

echo "Checking production database configuration..."
echo "Server: $PROD_SERVER"
echo "Container: $PROD_CONTAINER"
echo ""

echo "Available databases:"
ssh $PROD_SERVER "docker exec $PROD_CONTAINER psql -U postgres -l"

echo ""
echo "Environment variables in container:"
ssh $PROD_SERVER "docker exec $PROD_CONTAINER env | grep -E 'POSTGRES|DATABASE'"

echo ""
echo "If you need to sync this database, use: ./sync-prod-db.sh $PROD_SERVER $PROD_CONTAINER"
