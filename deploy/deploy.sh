#!/bin/bash
# Quick deployment script for production

set -e

echo "=== Players Production Deployment ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your production values!"
    echo "   Required: DATABASE_*, SECRET_KEY_BASE, CLOUDFLARE_TUNNEL_TOKEN"
    echo ""
    read -p "Press Enter after updating .env file, or Ctrl+C to cancel..."
fi

# Load environment
source .env

# Verify required vars
if [ -z "$SECRET_KEY_BASE" ] || [ "$SECRET_KEY_BASE" == "your_secret_key_base_here"* ]; then
    echo ""
    echo "❌ ERROR: SECRET_KEY_BASE not configured"
    echo ""
    echo "Generate one with:"
    echo "  openssl rand -hex 64"
    echo ""
    exit 1
fi

if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ] || [ "$CLOUDFLARE_TUNNEL_TOKEN" == "your_cloudflare"* ]; then
    echo ""
    echo "❌ ERROR: CLOUDFLARE_TUNNEL_TOKEN not configured"
    echo ""
    echo "Get your token from: https://one.dash.cloudflare.com/"
    echo "Create a tunnel and copy the token"
    echo ""
    exit 1
fi

echo "✓ Environment configured"
echo ""

# Pull latest code (if git repo)
if [ -d ../.git ]; then
    echo "Pulling latest code..."
    cd ..
    git pull origin main || echo "⚠️  Could not pull latest code"
    cd deploy
    echo ""
fi

# Build and start services
echo "Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check if database is ready
echo ""
echo "Checking database connection..."
if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U "$DATABASE_USER" -d "$DATABASE_NAME" > /dev/null 2>&1; then
    echo "✓ Database is ready"
else
    echo "⚠️  Database not ready yet, you may need to wait and run migrations manually"
fi

# Run database setup
echo ""
read -p "Run database migrations? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating database and running migrations..."
    docker-compose -f docker-compose.prod.yml exec web bundle exec rails db:create db:migrate || true
fi

# Show status
echo ""
echo "=== Deployment Status ==="
docker-compose -f docker-compose.prod.yml ps
echo ""

# Show logs
echo "=== Recent Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=20
echo ""

echo "=== Deployment Complete ==="
echo ""
echo "Services are running!"
echo ""
echo "Useful commands:"
echo "  View logs:      docker-compose -f docker-compose.prod.yml logs -f"
echo "  Rails console:  docker-compose -f docker-compose.prod.yml exec web bundle exec rails console"
echo "  Restart:        docker-compose -f docker-compose.prod.yml restart"
echo "  Stop:           docker-compose -f docker-compose.prod.yml stop"
echo ""
