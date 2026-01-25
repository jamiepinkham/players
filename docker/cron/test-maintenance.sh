#!/bin/bash
# Test script to verify maintenance service setup

echo "🧪 Testing BMPL Maintenance Service"
echo "===================================="
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found"
    exit 1
fi

# Check if maintenance service is defined
echo "1. Checking if maintenance service is defined..."
if docker-compose config --services | grep -q "maintenance"; then
    echo "   ✓ Maintenance service found in docker-compose.yml"
else
    echo "   ❌ Maintenance service not found in docker-compose.yml"
    exit 1
fi

# Check if backup directory exists
echo ""
echo "2. Checking backup directory..."
if [ -d "/mnt/fenway-backups" ]; then
    echo "   ✓ /mnt/fenway-backups exists"
    echo "   Permissions: $(ls -ld /mnt/fenway-backups | awk '{print $1, $3, $4}')"
else
    echo "   ⚠️  /mnt/fenway-backups does not exist"
    echo "   Run: sudo mkdir -p /mnt/fenway-backups && sudo chown -R \$USER:\$USER /mnt/fenway-backups"
fi

# Check if scripts exist
echo ""
echo "3. Checking maintenance scripts..."
SCRIPTS=(
    "docker/cron/maintenance.sh"
    "docker/cron/crontab"
    "docker/cron/cron-entrypoint.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo "   ✓ $script exists"
    else
        echo "   ❌ $script missing"
    fi
done

# Check if maintenance container is running
echo ""
echo "4. Checking maintenance container status..."
if docker-compose ps maintenance | grep -q "Up"; then
    echo "   ✓ Maintenance container is running"
else
    echo "   ⚠️  Maintenance container is not running"
    echo "   Start it with: docker-compose up -d maintenance"
fi

# Test backup creation (if container is running)
echo ""
echo "5. Testing backup creation..."
if docker-compose ps maintenance | grep -q "Up"; then
    echo "   Running test backup..."
    docker-compose exec -T maintenance bash -c "pg_dump -U \${DATABASE_USER} -h db -d \${DATABASE_NAME} -F c -b > /backups/test_backup_$(date +%Y%m%d_%H%M%S).dump"

    if [ $? -eq 0 ]; then
        echo "   ✓ Test backup successful"
        echo "   Backups in directory:"
        docker-compose exec -T maintenance ls -lh /backups/ | tail -5
    else
        echo "   ❌ Test backup failed"
    fi
else
    echo "   ⚠️  Skipped (container not running)"
fi

# Check cron logs
echo ""
echo "6. Recent cron logs (if any)..."
if docker-compose ps maintenance | grep -q "Up"; then
    docker-compose exec -T maintenance sh -c "if [ -f /var/log/cron.log ]; then tail -10 /var/log/cron.log; else echo '   (no logs yet)'; fi"
else
    echo "   ⚠️  Skipped (container not running)"
fi

echo ""
echo "===================================="
echo "Test complete!"
echo ""
echo "To run maintenance manually:"
echo "  docker-compose exec maintenance /usr/local/bin/maintenance.sh"
echo ""
