#!/bin/bash
set -e

# Deployment script for players application
# Usage: ./deploy.sh [dev|qa|prod]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if environment argument is provided
if [ -z "$1" ]; then
    print_error "Environment argument required"
    echo "Usage: $0 [dev|qa|prod]"
    echo ""
    echo "Examples:"
    echo "  $0 dev   # Deploy development environment"
    echo "  $0 qa    # Deploy QA environment"
    echo "  $0 prod  # Deploy production environment"
    exit 1
fi

ENV=$1

# Determine which compose file to use
case $ENV in
    dev)
        COMPOSE_FILE="docker-compose.yml -f docker-compose.dev.yml"
        print_info "Deploying DEVELOPMENT environment"
        ;;
    qa)
        COMPOSE_FILE="docker-compose.yml -f docker-compose.qa.yml"
        print_info "Deploying QA environment"
        ;;
    prod)
        COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
        print_warning "Deploying PRODUCTION environment"
        # Add confirmation for production
        read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Production deployment cancelled"
            exit 0
        fi
        ;;
    *)
        print_error "Invalid environment: $ENV"
        echo "Valid environments: dev, qa, prod"
        exit 1
        ;;
esac

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found in current directory"
    print_info "Create .env from .env.$ENV template"
    exit 1
fi

# Check if docker-compose files exist
if [ ! -f docker-compose.yml ]; then
    print_error "docker-compose.yml not found in current directory"
    exit 1
fi

print_info "Using compose files: $COMPOSE_FILE"

# Stop and remove containers
print_info "Stopping containers..."
docker-compose -f $COMPOSE_FILE down

# Pull latest images
print_info "Pulling latest images..."
if docker-compose -f $COMPOSE_FILE pull; then
    print_info "Images pulled successfully"
else
    print_error "Failed to pull images"
    exit 1
fi

# Start containers
print_info "Starting containers..."
if docker-compose -f $COMPOSE_FILE up -d; then
    print_info "Containers started successfully"
else
    print_error "Failed to start containers"
    exit 1
fi

# Wait a moment for containers to initialize
print_info "Waiting for services to initialize..."
sleep 3

# Show container status
print_info "Container status:"
docker-compose -f $COMPOSE_FILE ps

# Check if players service is healthy
print_info "Checking application health..."
sleep 2

if docker-compose -f $COMPOSE_FILE ps | grep -q "players.*Up"; then
    print_info "✓ Application is running"

    # Try to hit health endpoint if available
    if command -v curl &> /dev/null; then
        echo ""
        print_info "Testing health endpoint..."
        if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
            print_info "✓ Health check passed"
        else
            print_warning "Health check endpoint not responding yet (may still be starting)"
        fi
    fi
else
    print_warning "Application may not be running correctly"
fi

# Show logs
echo ""
print_info "Recent logs (Ctrl+C to stop following):"
echo ""
docker-compose -f $COMPOSE_FILE logs --tail=50 -f
