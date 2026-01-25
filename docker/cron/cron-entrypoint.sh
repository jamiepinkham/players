#!/bin/bash
set -e

echo "Starting BMPL Maintenance Cron Service"
echo "======================================="
echo ""

# Install cron if not present
if ! command -v cron &> /dev/null; then
    echo "Installing cron..."
    apt-get update && apt-get install -y cron postgresql-client
fi

# Set up crontab
echo "Setting up crontab..."
crontab /etc/cron.d/maintenance-cron

# Create log file
touch /var/log/cron.log

echo "Cron schedule:"
crontab -l
echo ""
echo "Cron service started. Logs will appear below:"
echo "----------------------------------------------"

# Start cron and tail logs
cron && tail -f /var/log/cron.log
