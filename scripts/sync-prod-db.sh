#!/bin/bash
# Sync production database from remote server to local Docker environment
# Usage: ./sync-prod-db.sh [server] [container] [db_name]
#   or set PROD_SERVER, PROD_CONTAINER, PROD_DB_NAME environment variables

set -e

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Use arguments or environment variables
PROD_SERVER="${1:-${PROD_SERVER}}"
PROD_CONTAINER="${2:-${PROD_CONTAINER}}"
PROD_DB_NAME="${3:-${PROD_DB_NAME:-players_production}}"
PROD_DB_USER="${PROD_DB_USER:-postgres}"

LOCAL_DB_USER="${DATABASE_USER:-postgres}"
LOCAL_DB_NAME="${DATABASE_NAME:-players_development}"

# Check if server is specified
if [ -z "$PROD_SERVER" ]; then
  echo -e "${RED}Error: Production server not specified${NC}"
  echo ""
  echo "Usage:"
  echo "  $0 user@hostname [container] [db_name]"
  echo ""
  echo "Examples:"
  echo "  $0 user@prodserver players-db-1"
  echo "  $0 user@prodserver players-db-1 players_production"
  echo ""
  echo "Or set environment variables:"
  echo "  export PROD_SERVER=user@hostname"
  echo "  export PROD_CONTAINER=players-db-1"
  echo "  export PROD_DB_NAME=players_production"
  echo "  $0"
  echo ""
  exit 1
fi

# Check if container is specified
if [ -z "$PROD_CONTAINER" ]; then
  echo -e "${RED}Error: Production container not specified${NC}"
  echo ""
  echo "Run ./check-prod-db.sh $PROD_SERVER to see available containers"
  echo ""
  exit 1
fi

DUMP_FILE="db-restore/production_$(date +%Y%m%d_%H%M%S).dump"

echo "=================================================="
echo -e "  ${BLUE}Production Database Sync${NC}"
echo "=================================================="
echo ""
echo "Production Server:    $PROD_SERVER"
echo "Production Container: $PROD_CONTAINER"
echo "Production Database:  $PROD_DB_NAME"
echo ""
echo "Local Database:       $LOCAL_DB_NAME"
echo ""

# Confirm before proceeding
read -p "This will REPLACE your local database. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi
echo ""

# Create db-restore directory if it doesn't exist
mkdir -p db-restore

# Step 1: Dump production database
echo -e "${BLUE}📦 Step 1: Dumping production database...${NC}"
echo "  Server: $PROD_SERVER"
echo "  Container: $PROD_CONTAINER"
echo "  Database: $PROD_DB_NAME"
echo ""

ssh $PROD_SERVER "docker exec $PROD_CONTAINER pg_dump -U $PROD_DB_USER -Fc $PROD_DB_NAME" > $DUMP_FILE

echo -e "${GREEN}✓ Production database dumped to: $DUMP_FILE${NC}"
echo "  Size: $(du -h $DUMP_FILE | cut -f1)"
echo ""

# Step 2: Stop local containers
echo -e "${BLUE}🛑 Step 2: Stopping local Docker containers...${NC}"
docker-compose down
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Step 3: Remove old database volume
echo -e "${BLUE}🗑️  Step 3: Removing old local database...${NC}"
docker volume rm players_pgdata 2>/dev/null || true
echo -e "${GREEN}✓ Old database removed${NC}"
echo ""

# Step 4: Start fresh database
echo -e "${BLUE}🚀 Step 4: Starting fresh local database...${NC}"
docker-compose up -d db

echo "⏳ Waiting for database to be ready..."
sleep 8

# Wait for database to be healthy
until docker-compose exec -T db pg_isready -U $LOCAL_DB_USER > /dev/null 2>&1; do
  echo "   Still waiting..."
  sleep 2
done

echo -e "${GREEN}✓ Database is ready${NC}"
echo ""

# Step 5: Restore dump to local database
echo -e "${BLUE}📥 Step 5: Restoring database to local Docker...${NC}"
echo "  Database: $LOCAL_DB_NAME"
echo ""

docker-compose exec -T db pg_restore \
  -U $LOCAL_DB_USER \
  -d $LOCAL_DB_NAME \
  --clean --if-exists --no-owner --no-acl \
  < $DUMP_FILE

echo -e "${GREEN}✓ Database restored successfully!${NC}"
echo ""

# Step 6: Start all services
echo -e "${BLUE}🚀 Step 6: Starting all services...${NC}"
docker-compose up -d
sleep 3
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Step 7: Run migrations
echo -e "${BLUE}🔄 Step 7: Running pending migrations...${NC}"
echo ""

docker-compose exec web bundle exec rails db:migrate

echo ""
echo "=================================================="
echo -e "  ${GREEN}✅ Production database sync complete!${NC}"
echo "=================================================="
echo ""
echo "Database dump saved to: $DUMP_FILE"
echo ""
echo "Next steps:"
echo "  1. Test the app: http://localhost:3000"
echo "  2. Check migrations: docker-compose exec web rails db:migrate:status"
echo "  3. View logs: docker-compose logs -f web"
echo ""
