#!/bin/bash
# Deployment verification script

set -e

echo "=== Production Deployment Verification ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found"
    echo "   Copy .env.example to .env and configure it"
    exit 1
else
    echo "✓ .env file found"
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ ERROR: docker-compose not found"
    exit 1
else
    echo "✓ docker-compose available"
fi

# Validate docker-compose configuration
echo ""
echo "Validating docker-compose configuration..."
if docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
    echo "✓ docker-compose.prod.yml is valid"
else
    echo "❌ ERROR: docker-compose.prod.yml has errors"
    exit 1
fi

# Check required environment variables
echo ""
echo "Checking required environment variables..."
source .env

required_vars=(
    "DATABASE_USER"
    "DATABASE_PASSWORD"
    "DATABASE_NAME"
    "SECRET_KEY_BASE"
    "CLOUDFLARE_TUNNEL_TOKEN"
)

all_set=true
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" == "your_"* ]; then
        echo "❌ $var is not set or using default value"
        all_set=false
    else
        echo "✓ $var is set"
    fi
done

if [ "$all_set" = false ]; then
    echo ""
    echo "❌ ERROR: Some required environment variables are not configured"
    echo "   Please update your .env file"
    exit 1
fi

# Check if Dockerfile.web.prod exists
if [ ! -f ../Dockerfile.web.prod ]; then
    echo ""
    echo "❌ ERROR: Dockerfile.web.prod not found in parent directory"
    exit 1
else
    echo ""
    echo "✓ Dockerfile.web.prod found"
fi

# Check if services are running
echo ""
echo "Checking service status..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✓ Services are running"
    echo ""
    docker-compose -f docker-compose.prod.yml ps
else
    echo "ℹ Services are not running yet"
    echo "  Run: docker-compose -f docker-compose.prod.yml up -d"
fi

echo ""
echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Start services: docker-compose -f docker-compose.prod.yml up -d"
echo "2. Watch logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "3. Run migrations: docker-compose -f docker-compose.prod.yml exec web bundle exec rails db:migrate"
