# Convert Bids Nightly Task - Deployment Guide

## Overview

This adds a maintenance service that automatically converts leading bids to contracts every night at midnight.

**What it does:**
- Runs `bin/rails convert_bids:convert_leading` nightly at midnight
- Converts bids that are >24 hours old into contracts
- Logs output to `/var/log/cron.log` in the container

## Portainer Deployment

### Step 1: Update Your Stack

1. Open **Portainer** web UI
2. Go to **Stacks** → Click your stack name
3. Click **Editor**
4. Replace the YAML with the updated `docker-compose.portainer.yml`
5. Click **Update the stack**
6. ✅ Check **"Re-pull image and redeploy"**
7. Click **Update**

### Step 2: Verify

After the stack updates:

1. Go to **Containers**
2. Look for `maintenance` container (should be green/running)
3. Click on it → **Logs** tab
4. You should see: `Cron service started. Convert bids task runs nightly at midnight.`

### Step 3: Test (Optional)

To test without waiting for midnight:

1. **Containers** → `maintenance` → **Console**
2. Connect with `/bin/bash`
3. Run:
   ```bash
   cd /app && bin/rails convert_bids:convert_leading
   ```

## What Was Added to docker-compose.portainer.yml

```yaml
  maintenance:
    image: ghcr.io/jamiepinkham/players:main
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    command: >
      bash -c "
      apt-get update && apt-get install -y cron &&
      echo '0 0 * * * cd /app && bin/rails convert_bids:convert_leading >> /var/log/cron.log 2>&1' > /etc/cron.d/convert-bids &&
      chmod 0644 /etc/cron.d/convert-bids &&
      crontab /etc/cron.d/convert-bids &&
      touch /var/log/cron.log &&
      echo 'Cron service started. Convert bids task runs nightly at midnight.' &&
      cron && tail -f /var/log/cron.log
      "
    environment:
      DATABASE_USER: ${DATABASE_USER}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_HOST: ${DATABASE_HOST}
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      RAILS_ENV: ${RAILS_ENV}
```

## Monitoring

### View Logs in Portainer

1. **Containers** → `maintenance` → **Logs**
2. Enable **Auto-refresh**
3. After midnight, you'll see output from the convert_bids task

### Check Cron Schedule

1. **Containers** → `maintenance` → **Console**
2. Run: `crontab -l`
3. Should show: `0 0 * * * cd /app && bin/rails convert_bids:convert_leading >> /var/log/cron.log 2>&1`

### View Cron Logs

1. **Containers** → `maintenance` → **Console**
2. Run: `cat /var/log/cron.log`

## Changing the Schedule

To run at a different time:

1. **Stacks** → Your stack → **Editor**
2. Find this line:
   ```
   echo '0 0 * * * cd /app && bin/rails convert_bids:convert_leading
   ```
3. Change `0 0` to your desired time:
   - `0 0` = Midnight (00:00)
   - `0 2` = 2:00 AM
   - `30 1` = 1:30 AM
   - `0 */6` = Every 6 hours
4. Click **Update the stack**

## Troubleshooting

### Container won't start
- Check logs in Portainer
- Ensure all environment variables are set

### Task not running
```bash
# Check if cron is running
ps aux | grep cron

# Check crontab
crontab -l

# Check logs
cat /var/log/cron.log

# Test manually
cd /app && bin/rails convert_bids:convert_leading
```

### No logs appearing
- Wait until after midnight for first run
- Check `/var/log/cron.log` in console
- Run task manually to test

## Manual Execution

To run the task immediately:

**Via Portainer Console:**
1. **Containers** → `maintenance` → **Console** → `/bin/bash`
2. Run: `cd /app && bin/rails convert_bids:convert_leading`

**Via Docker CLI:**
```bash
docker-compose exec maintenance bin/rails convert_bids:convert_leading
```

## Stopping the Service

To stop the nightly task:

**In Portainer:**
1. **Containers** → Find `maintenance` container
2. Click **Stop** button

**To permanently remove:**
1. **Stacks** → Your stack → **Editor**
2. Remove the `maintenance:` service section
3. Click **Update the stack**

## Notes

- The task runs at midnight based on the **container's timezone** (usually UTC)
- Logs are stored in the container at `/var/log/cron.log`
- The service will automatically restart if it crashes (due to `restart: unless-stopped`)
- Uses the same Docker image as your main Rails app
