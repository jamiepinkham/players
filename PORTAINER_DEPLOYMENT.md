# Portainer Deployment Guide - Maintenance Service

## Overview

This guide will help you add the nightly maintenance service to your existing Portainer stack.

## What the Maintenance Service Does

**Runs every night at midnight:**
1. Creates a database backup to `/mnt/fenway-backups/`
2. Converts leading bids (>24 hours old) to contracts
3. Cleans up backups older than 30 days

## Prerequisites

### 1. Create Backup Directory on Server

SSH into your production server:

```bash
sudo mkdir -p /mnt/fenway-backups
sudo chown -R $USER:$USER /mnt/fenway-backups
sudo chmod 755 /mnt/fenway-backups
```

### 2. Upload maintenance.sh Script

The `maintenance.sh` file needs to be on your server where Portainer can access it.

**Option A: Upload via SCP**

```bash
scp maintenance.sh user@production-server:/path/to/your/stack/maintenance.sh
```

**Option B: Create file on server**

```bash
ssh user@production-server
cd /path/to/your/stack
nano maintenance.sh
# Paste contents from maintenance.sh
# Save with Ctrl+X, Y, Enter
chmod +x maintenance.sh
```

The file should be in the same directory as your docker-compose files.

## Portainer Deployment Steps

### Step 1: Update Your Stack

1. **Open Portainer** (https://your-server:9443)
2. Go to **Stacks** in the left menu
3. Click on your **players** stack
4. Click **Editor** button
5. Replace the entire YAML with the updated `docker-compose.portainer.yml` content
6. Scroll down and click **Update the stack**
7. ✅ Check **"Re-pull image and redeploy"**
8. Click **Update** button

### Step 2: Verify Deployment

After the stack updates, you should see a new container:

1. Go to **Containers** in Portainer
2. Look for a container named like `players_maintenance_1` or `players-maintenance-1`
3. It should have status **"running"** (green)

### Step 3: Check Logs

1. In **Containers**, click on the `maintenance` container
2. Click **Logs** tab
3. You should see:
   ```
   Cron service started. Maintenance runs nightly at midnight.
   ```

### Step 4: Test Manual Execution

To test without waiting for midnight:

1. In **Containers**, click on the `maintenance` container
2. Click **Console** tab
3. Select `/bin/bash` as shell
4. Click **Connect**
5. In the console, run:
   ```bash
   /usr/local/bin/maintenance.sh
   ```

You should see output showing:
- Database backup being created
- Bids being converted
- Old backups being cleaned up

### Step 5: Verify Backups

On your server, check that backups are being created:

```bash
ls -lh /mnt/fenway-backups/
```

You should see a file like: `bmpl_backup_20260125_000000.dump`

## Updated docker-compose.portainer.yml

Here's what was added to your stack:

```yaml
  maintenance:
    image: ghcr.io/jamiepinkham/players:main
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    command: >
      bash -c "
      apt-get update && apt-get install -y cron postgresql-client &&
      echo '0 0 * * * /usr/local/bin/maintenance.sh >> /var/log/cron.log 2>&1' > /etc/cron.d/maintenance-cron &&
      chmod 0644 /etc/cron.d/maintenance-cron &&
      crontab /etc/cron.d/maintenance-cron &&
      touch /var/log/cron.log &&
      echo 'Cron service started. Maintenance runs nightly at midnight.' &&
      cron && tail -f /var/log/cron.log
      "
    volumes:
      - /mnt/fenway-backups:/backups
      - ./maintenance.sh:/usr/local/bin/maintenance.sh:ro
    environment:
      DATABASE_USER: ${DATABASE_USER}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_HOST: ${DATABASE_HOST}
```

## Monitoring in Portainer

### View Real-Time Logs

1. **Containers** → Click on `maintenance` container → **Logs** tab
2. Enable **Auto-refresh** toggle
3. Set refresh rate to 5 seconds
4. You'll see logs update automatically

### Check Container Health

1. **Containers** → Look for `maintenance` container
2. Green dot = running ✅
3. Red dot = stopped ❌
4. If stopped, click **Start** button

### View Container Stats

1. Click on `maintenance` container
2. Click **Stats** tab
3. View CPU, memory, network usage

## Troubleshooting in Portainer

### Container won't start

**Check logs:**
1. **Containers** → `maintenance` → **Logs**
2. Look for error messages

**Common issues:**
- `maintenance.sh` file not found → Upload the file to the correct path
- `/mnt/fenway-backups` not accessible → Check directory permissions
- Environment variables missing → Check Stack environment variables

### Cron not executing

**Check cron is running:**
1. **Containers** → `maintenance` → **Console**
2. Connect with `/bin/bash`
3. Run: `ps aux | grep cron`
4. Should show cron process running

**Check cron schedule:**
```bash
crontab -l
```

Should show:
```
0 0 * * * /usr/local/bin/maintenance.sh >> /var/log/cron.log 2>&1
```

**Check cron logs:**
```bash
cat /var/log/cron.log
```

### No backups being created

**Test manually:**
1. **Containers** → `maintenance` → **Console**
2. Run: `/usr/local/bin/maintenance.sh`
3. Watch for errors

**Check backup directory:**
```bash
ls -la /backups/
```

**Check database connection:**
```bash
pg_dump -U ${DATABASE_USER} -h ${DATABASE_HOST} -d ${DATABASE_NAME} --version
```

### Maintenance script failing

**View detailed logs:**
1. **Containers** → `maintenance` → **Console**
2. Run manually with verbose output:
   ```bash
   bash -x /usr/local/bin/maintenance.sh
   ```

## Changing the Schedule

The maintenance runs at **midnight (00:00)** server time.

To change the schedule:

1. **Stacks** → Click your stack → **Editor**
2. Find this line in the `maintenance` service:
   ```
   echo '0 0 * * * /usr/local/bin/maintenance.sh >> /var/log/cron.log 2>&1'
   ```
3. Modify the cron schedule:
   - `0 0 * * *` = Midnight daily
   - `0 2 * * *` = 2 AM daily
   - `30 1 * * 0` = 1:30 AM every Sunday
   - `0 */6 * * *` = Every 6 hours
4. Click **Update the stack**
5. ✅ Check **"Re-pull image and redeploy"**

## Restoring from Backup

If you need to restore from a backup:

1. **Containers** → Stop the `players` container
2. **Containers** → `db` → **Console** → Connect with `/bin/bash`
3. List backups:
   ```bash
   ls -lh /mnt/fenway-backups/
   ```
4. Restore specific backup:
   ```bash
   pg_restore -U postgres -d <database_name> -c -v \
     /mnt/fenway-backups/bmpl_backup_YYYYMMDD_HHMMSS.dump
   ```
5. **Containers** → Start the `players` container

## Files You Need

Make sure you have these files:

- ✅ `docker-compose.portainer.yml` (updated)
- ✅ `maintenance.sh` (on server, in stack directory)

## Support

If you encounter issues:

1. Check container logs in Portainer
2. Test manual execution in console
3. Verify backup directory exists and is writable
4. Check environment variables are set correctly

## Next Steps

After deployment:

- ✅ Monitor logs for first few days
- ✅ Verify backups appear in `/mnt/fenway-backups/`
- ✅ Test restore procedure with a backup
- ✅ Set up off-site backup copying (optional)
- ✅ Document restore procedure for your team
