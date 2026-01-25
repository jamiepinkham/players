# BMPL Maintenance Service Setup

## Overview

I've added a nightly maintenance service to your stack that automatically:

1. **Creates a database backup** at midnight every night
2. **Moves backups to `/mnt/fenway-backups`**
3. **Runs the `convert_bids:convert_leading` rake task** (converts bids >24 hours old to contracts)
4. **Cleans up old backups** (keeps last 30 days)

## Files Created

```
docker/cron/
├── README.md              # Detailed documentation
├── maintenance.sh         # Main maintenance script
├── crontab               # Cron schedule (runs at midnight)
├── cron-entrypoint.sh    # Container startup script
├── test-maintenance.sh   # Test script
└── Dockerfile            # (Optional) Separate image config
```

## Updated Files

- `docker-compose.yml` - Added new `maintenance` service

## Deployment Steps

### 1. Create Backup Directory on Production Server

SSH into your production server and run:

```bash
sudo mkdir -p /mnt/fenway-backups
sudo chown -R $USER:$USER /mnt/fenway-backups
sudo chmod 755 /mnt/fenway-backups
```

### 2. Deploy via Portainer

#### Option A: Update Existing Stack

1. Open Portainer web UI
2. Go to **Stacks**
3. Click on your stack name
4. Click **Editor**
5. Copy the contents of your updated `docker-compose.yml`
6. Click **Update the stack**
7. Check "Re-pull image and redeploy"
8. Click **Update**

#### Option B: Upload Files via SCP

```bash
# Copy all files to production
scp -r docker/cron user@production-server:/path/to/app/docker/
scp docker-compose.yml user@production-server:/path/to/app/
```

Then update stack in Portainer using the Editor.

### 3. Start the Maintenance Service

In Portainer:
1. Go to **Containers**
2. Find the `maintenance` container
3. Click **Start** (play button)

Or via SSH:

```bash
cd /path/to/app
docker-compose up -d maintenance
```

### 4. Verify Setup

```bash
# View logs
docker-compose logs -f maintenance

# Check if cron is running
docker-compose exec maintenance ps aux | grep cron

# View cron schedule
docker-compose exec maintenance crontab -l

# Check backups directory
ls -lh /mnt/fenway-backups/
```

## Testing Before Midnight

To test the maintenance task immediately:

```bash
# Run test script
./docker/cron/test-maintenance.sh

# Or run maintenance manually
docker-compose exec maintenance /usr/local/bin/maintenance.sh
```

## Monitoring

### View Maintenance Logs in Portainer

1. Go to **Containers**
2. Click on `maintenance` container
3. Click **Logs** tab
4. Enable **Auto-refresh**

### Check Backup Files

```bash
# List all backups
ls -lh /mnt/fenway-backups/

# Show most recent
ls -lt /mnt/fenway-backups/ | head -5

# Check total backup size
du -sh /mnt/fenway-backups/
```

### View Cron Execution History

```bash
docker-compose exec maintenance cat /var/log/cron.log
```

## Maintenance Schedule

**Current schedule:** Every night at **00:00 (midnight)** server time

To change the schedule, edit `docker/cron/crontab`:

```cron
# Format: minute hour day month day-of-week command
0 0 * * * /usr/local/bin/maintenance.sh >> /var/log/cron.log 2>&1
```

Examples:
- `0 2 * * *` - 2:00 AM daily
- `30 1 * * 0` - 1:30 AM every Sunday
- `0 */6 * * *` - Every 6 hours

After changing, restart the maintenance service:

```bash
docker-compose restart maintenance
```

## Backup Retention

**Current retention:** 30 days

Backups older than 30 days are automatically deleted each night.

To change retention, edit `docker/cron/maintenance.sh` line:

```bash
find /backups -name "bmpl_backup_*.dump" -type f -mtime +30 -delete
```

Change `+30` to desired number of days (e.g., `+60` for 60 days).

## Restoring from Backup

```bash
# 1. Stop Rails app
docker-compose stop players

# 2. List available backups
ls -lh /mnt/fenway-backups/

# 3. Restore specific backup
cat /mnt/fenway-backups/bmpl_backup_YYYYMMDD_HHMMSS.dump | \
  docker-compose exec -T db pg_restore -U postgres -d <database_name> -c -v

# 4. Start Rails app
docker-compose start players
```

## Troubleshooting

### Maintenance service won't start

```bash
# Check logs
docker-compose logs maintenance

# Check if port conflicts
docker-compose ps

# Rebuild container
docker-compose up -d --build maintenance
```

### Backups not being created

```bash
# Check directory permissions
ls -ld /mnt/fenway-backups/

# Test manual backup
docker-compose exec maintenance \
  pg_dump -U ${DATABASE_USER} -h db -d ${DATABASE_NAME} \
  -F c -b > /backups/manual_test.dump

# Check environment variables
docker-compose exec maintenance env | grep DATABASE
```

### Cron not executing

```bash
# Check if cron is running
docker-compose exec maintenance ps aux | grep cron

# Check crontab
docker-compose exec maintenance crontab -l

# Check logs
docker-compose exec maintenance cat /var/log/cron.log

# Restart maintenance service
docker-compose restart maintenance
```

### Backups directory full

```bash
# Check disk space
df -h /mnt/fenway-backups/

# Manually clean old backups
find /mnt/fenway-backups -name "bmpl_backup_*.dump" -type f -mtime +30 -delete

# Or reduce retention period (see "Backup Retention" above)
```

## Manual Operations

### Run maintenance immediately

```bash
docker-compose exec maintenance /usr/local/bin/maintenance.sh
```

### Create backup without running bid conversion

```bash
docker-compose exec maintenance \
  pg_dump -U ${DATABASE_USER} -h db -d ${DATABASE_NAME} \
  -F c -b > /backups/manual_backup_$(date +%Y%m%d_%H%M%S).dump
```

### Run bid conversion without backup

```bash
docker-compose exec players bin/rails convert_bids:convert_leading
```

## Security Notes

- Backups are stored as PostgreSQL custom format (`.dump` files)
- Backups contain sensitive data - ensure `/mnt/fenway-backups` has proper permissions
- Consider encrypting backups for long-term storage
- Consider copying backups to offsite storage for disaster recovery

## Next Steps

1. ✅ Deploy the maintenance service
2. ✅ Test it manually using `./docker/cron/test-maintenance.sh`
3. ✅ Monitor logs for the first few days
4. ✅ Verify backups are being created in `/mnt/fenway-backups/`
5. ✅ Set up alerts for backup failures (optional)
6. ✅ Document backup restore procedure for your team

## Support

For detailed documentation, see: `docker/cron/README.md`

For questions or issues, check the logs first:

```bash
docker-compose logs -f maintenance
```
