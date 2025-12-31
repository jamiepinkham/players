#!/bin/bash
# Verify Production Docker Image
# This script mimics the CI verification process locally

set -e

IMAGE_NAME="players-web-prod:local"
CONTAINER_NAME="players-verify-$$"
DB_CONTAINER_NAME="players-verify-db-$$"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================="
echo "Production Image Verification"
echo "============================================="
echo ""

cleanup() {
    echo ""
    echo "Cleaning up containers..."
    docker stop $CONTAINER_NAME $DB_CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME $DB_CONTAINER_NAME 2>/dev/null || true
}

trap cleanup EXIT

# Step 1: Build the image
echo "Step 1: Building production image..."
echo "---------------------------------------------"
if docker build -f Dockerfile.web.prod -t $IMAGE_NAME . ; then
    echo -e "${GREEN}✅ Build succeeded${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo "Step 2: Starting test database..."
echo "---------------------------------------------"
docker run -d \
    --name $DB_CONTAINER_NAME \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=testpass123 \
    -e POSTGRES_DB=players_test \
    postgres:13

# Wait for database
echo "Waiting for database to be ready..."
for i in {1..30}; do
    if docker exec $DB_CONTAINER_NAME pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Database failed to start${NC}"
        docker logs $DB_CONTAINER_NAME
        exit 1
    fi
    sleep 2
done

echo ""
echo "Step 3: Starting application container..."
echo "---------------------------------------------"
docker run -d \
    --name $CONTAINER_NAME \
    --link $DB_CONTAINER_NAME:db \
    -e RAILS_ENV=production \
    -e SECRET_KEY_BASE=test_secret_key_for_local_verification_at_least_32_chars_long \
    -e DATABASE_HOST=$DB_CONTAINER_NAME \
    -e DATABASE_USER=postgres \
    -e DATABASE_PASSWORD=testpass123 \
    -e DATABASE_NAME=players_test \
    -e RAILS_LOG_TO_STDOUT=true \
    -e RAILS_SERVE_STATIC_FILES=true \
    -p 3001:3000 \
    $IMAGE_NAME

echo -e "${GREEN}✅ Container started${NC}"

echo ""
echo "Step 4: Waiting for application to be ready..."
echo "---------------------------------------------"
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    # Check if container is still running
    if ! docker ps | grep -q $CONTAINER_NAME; then
        echo -e "${RED}❌ Container stopped unexpectedly${NC}"
        echo "Container logs:"
        docker logs $CONTAINER_NAME
        exit 1
    fi

    # Try health endpoint
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Application is responding${NC}"
        break
    fi

    if [ $ATTEMPT -eq $(($MAX_ATTEMPTS - 1)) ]; then
        echo -e "${RED}❌ Application failed to become ready${NC}"
        echo "Container logs:"
        docker logs $CONTAINER_NAME
        exit 1
    fi

    ATTEMPT=$((ATTEMPT + 1))
    echo "Waiting... ($ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

echo ""
echo "Step 5: Testing health endpoint..."
echo "---------------------------------------------"
RESPONSE=$(curl -s http://localhost:3001/health)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)

echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

echo ""
echo "Step 6: Testing root endpoint..."
echo "---------------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/)
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Root endpoint check passed${NC}"
else
    echo -e "${RED}❌ Root endpoint check failed${NC}"
    exit 1
fi

echo ""
echo "============================================="
echo -e "${GREEN}✅ ALL VERIFICATION CHECKS PASSED${NC}"
echo "============================================="
echo ""
echo "The production image is ready for deployment!"
echo ""
echo "Test endpoints available (while script is running):"
echo "  Health: http://localhost:3001/health"
echo "  Root:   http://localhost:3001/"
echo ""
echo "To keep the container running for manual testing,"
echo "press Ctrl+C now. Otherwise, containers will be cleaned up."
echo ""

read -t 10 -p "Press Enter to cleanup or wait 10 seconds..." || true

exit 0
