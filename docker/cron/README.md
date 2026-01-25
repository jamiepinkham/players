# BMPL Maintenance Service

This service runs nightly maintenance tasks for the BMPL application.

## What It Does

**Runs daily at midnight (server time):**

1. **Creates a database backup** to `/mnt/fenway-backups/bmpl_backup_YYYYMMDD_HHMMSS.dump`
2. **Converts leading bids** that are >24 hours old to contracts (via `convert_bids:convert_leading` rake task)
3. **Cleans up old backups** - Keeps only the last 30 days of backups

## Setup

### 1. Ensure Backup Directory Exists

On your production server:

```bash
sudo mkdir -p /mnt/fenway-backups
sudo chown -R $USER:$USER /mnt/fenway-backups
```

### 2. Deploy the Stack

Update your stack in Portainer with the new docker-compose.yml, which includes the `maintenance` service.

### 3. Start the Maintenance Service

In Portainer:
- Go to **Containers**
- Find the `maintenance` container
- Click **Start**

Or via command line:

```bash
docker-compose up -d maintenance
```

## Monitoring

### View Logs

**In Portainer:**
1. Go to **Containers**
2. Click on the `maintenance` container
3. Click **Logs**
4. Enable **Auto-refresh**

**Via Command Line:**

```bash
# View logs
docker-compose logs -f maintenance

# View last 100 lines
docker-compose logs --tail=100 maintenance
```

### Check Backups

```bash
# List backups
ls -lh /mnt/fenway-backups/

# Check latest backup
ls -lht /mnt/fenway-backups/ | head -5

# Count backups
ls /mnt/fenway-backups/bmpl_backup_*.dump | wc -l
```

## Manual Execution

To run the maintenance task immediately (without waiting for midnight):

```bash
docker-compose exec maintenance /usr/local/bin/maintenance.sh
```

## Cron Schedule

The cron schedule is defined in `docker/cron/crontab`:

```
0 0 * * * /usr/local/bin/maintenance.sh >> /var/log/cron.log 2>&1
```

This means:
- `0 0` = At 00:00 (midnight)
- `* * *` = Every day, every month, every day of week

To change the schedule, edit the crontab file and restart the maintenance service.

## Troubleshooting

### Cron not running

Check if cron service is running inside container:

```bash
docker-compose exec maintenance ps aux | grep cron
```

### Check cron logs

```bash
docker-compose exec maintenance cat /var/log/cron.log
```

### Verify crontab

```bash
docker-compose exec maintenance crontab -l
```

### Test database connection

```bash
docker-compose exec maintenance pg_dump -U ${DATABASE_USER} -h db -d ${DATABASE_NAME} --version
```

### Manual backup test

```bash
docker-compose exec maintenance pg_dump -U ${DATABASE_USER} -h db -d ${DATABASE_NAME} -F c -b > /backups/test_backup.dump
```

## Files

- `maintenance.sh` - Main maintenance script
- `crontab` - Cron schedule configuration
- `cron-entrypoint.sh` - Container startup script
- `Dockerfile` - (Optional) Separate image for cron service

## Environment Variables

The maintenance service uses these environment variables from `.env`:

- `DATABASE_USER` - PostgreSQL username
- `DATABASE_PASSWORD` - PostgreSQL password
- `DATABASE_NAME` - Database name

## Backup Retention

By default, backups older than 30 days are automatically deleted.

To change retention period, edit `maintenance.sh` and modify:

```bash
find /backups -name "bmpl_backup_*.dump" -type f -mtime +30 -delete
```

Change `+30` to desired number of days.

## Restoring from Backup

To restore a backup:

```bash
# Stop Rails app
docker-compose stop players

# Restore backup
cat /mnt/fenway-backups/bmpl_backup_YYYYMMDD_HHMMSS.dump | \
  docker-compose exec -T db pg_restore -U postgres -d <database_name> -c -v

# Start Rails app
docker-compose start players
```
