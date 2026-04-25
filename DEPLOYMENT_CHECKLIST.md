# Production Deployment Checklist - Cache Warmup & Fixes

**Branch**: `jp-consolidated-fa-improvements`
**Date**: 2026-04-25

## Changes Being Deployed

### 1. ✅ Player Image Timeout Fix
- Prevents 500 errors from slow MLB image API
- Adds 5-second timeout to image fetching

### 2. ✅ WAR Stats Removal
- Removes WAR from free agents list
- Removes WAR from player detail pages
- **Requires frontend rebuild**

### 3. ✅ Cache Warmup System
- Automated cache warmup on startup
- Prevents empty cache after restarts
- Fixes endless spinners on free agents page

## Pre-Deployment Checks

- [ ] All tests passing in QA
- [ ] UAT validation complete
- [ ] Database backup created
- [ ] Confirmed with team about deployment window

## Deployment Steps

### Step 1: Prepare Code

```bash
cd ~/dev/players
git checkout main
git pull origin main
git merge jp-consolidated-fa-improvements
# Resolve any conflicts if needed
git push origin main
```

- [ ] Branch merged to main
- [ ] No merge conflicts
- [ ] Pushed to GitHub

### Step 2: Build Frontend Assets

```bash
cd ~/dev/players/rails
npm install  # If dependencies changed
npm run build
git add app/assets/builds/
git commit -m "Build frontend assets for production"
git push origin main
```

- [ ] Frontend built successfully
- [ ] Built assets committed to main

### Step 3: Trigger Docker Image Build

**Option A: GitHub Actions (if configured)**
- Push to main should trigger automatic build
- Wait for build to complete (~5-10 min)
- [ ] Check Actions tab: https://github.com/jamiepinkham/players/actions

**Option B: Manual Build**
```bash
# Build and push from local machine
cd ~/dev/players
docker build -f rails/Dockerfile -t ghcr.io/jamiepinkham/players:main rails/
docker push ghcr.io/jamiepinkham/players:main
```

- [ ] Docker image built
- [ ] Image pushed to ghcr.io
- [ ] Verify new image tag exists

### Step 4: Backup Production Database

```bash
ssh ortiz@fenway

# Backup production database
docker exec players-db pg_dumpall -U postgres > /tmp/players_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh /tmp/players_backup_*.sql
```

- [ ] Database backup created
- [ ] Backup file size looks reasonable (> 1MB)
- [ ] Backup location noted: `/tmp/players_backup_YYYYMMDD_HHMMSS.sql`

### Step 5: Update Production Stack

**Via Portainer:**
1. Navigate to http://fenway:9000 (via SSH tunnel)
2. Stacks → `bmpl` → Editor
3. Check **"Re-pull images and redeploy"**
4. Click **"Update the stack"**
5. Wait for stack update to complete (~2-3 min)

**Via SSH (alternative):**
```bash
ssh ortiz@fenway

# Pull new image
docker pull ghcr.io/jamiepinkham/players:main

# Restart services
docker restart players-web players-sidekiq players-scheduler
```

- [ ] Stack updated successfully
- [ ] All containers started
- [ ] No errors in stack logs

### Step 6: Run Database Migrations (if any)

```bash
ssh ortiz@fenway

# Check if migrations needed
docker exec players-web rails db:migrate:status

# Run migrations if needed
docker exec players-web rails db:migrate

# Restart services after migrations
docker restart players-web players-sidekiq players-scheduler
```

- [ ] Migrations checked
- [ ] Migrations applied (if needed)
- [ ] Services restarted

### Step 7: Verify Cache Warmup

```bash
ssh ortiz@fenway

# Check if warmup ran on startup
docker logs players-web --tail 50 | grep -i "cache warmup"

# Expected output:
# "Quick Cache Warmup (Free Agents Only)"
# "Cached X/100 free agents"

# Verify cache is populated
docker exec players-web rails runner '
cache_key = "player_stats:darnatr01:2025"
if Rails.cache.exist?(cache_key)
  puts "✓ Cache working"
else
  puts "✗ Cache empty - run manual warmup"
end
'
```

- [ ] Cache warmup ran automatically
- [ ] Sample cache keys exist
- [ ] No errors in warmup logs

**If cache is empty, run manual warmup:**
```bash
docker exec players-web rails cache:warmup_quick
```

### Step 8: Smoke Test Production

**Test these critical flows:**

1. **Homepage**
   - [ ] https://players.billymartinplayersleague.com loads
   - [ ] No JavaScript errors in console

2. **Free Agents Page**
   - [ ] https://players.billymartinplayersleague.com/free_agents loads
   - [ ] Players display (no endless spinners)
   - [ ] Stats show correctly
   - [ ] **WAR column is NOT visible** ✅
   - [ ] Position filters work

3. **Player Detail Page**
   - [ ] Click on a player
   - [ ] Stats load within 2-3 seconds
   - [ ] **WAR is NOT shown** ✅
   - [ ] Player image loads (or default gray circle)
   - [ ] No 500 errors

4. **Authentication**
   - [ ] Login works
   - [ ] Password reset works
   - [ ] No database connection errors

5. **Background Jobs**
   - [ ] Check Sidekiq is running: `docker ps | grep sidekiq`
   - [ ] Stats jobs processing: `docker logs players-sidekiq --tail 50`

### Step 9: Monitor for Issues

**Watch logs for 10-15 minutes:**
```bash
ssh ortiz@fenway

# Watch all production services
docker logs -f players-web

# In another terminal, watch Sidekiq
docker logs -f players-sidekiq

# Check for errors
docker logs players-web --tail 100 | grep -i error
```

**Monitor for:**
- [ ] No timeout errors (Rack::Timeout::RequestTimeoutException)
- [ ] No 500 errors in web logs
- [ ] Stats jobs completing successfully
- [ ] No database errors
- [ ] Response times reasonable (< 1s for most requests)

### Step 10: Update QA Environment (Optional)

If you want QA to match production:

```bash
ssh ortiz@fenway

# Update QA to main branch
# In Portainer: Stacks → bmpl → Editor
# Change: GIT_REF=main
# Click "Update the stack"

# Or via docker-compose
docker pull ghcr.io/jamiepinkham/players:main
docker restart players-web-qa players-sidekiq-qa players-scheduler-qa

# Warm QA cache
docker exec players-web-qa rails cache:warmup_quick
```

- [ ] QA updated to main (optional)
- [ ] QA cache warmed (optional)

## Post-Deployment Verification

### Performance Check
- [ ] Free agents page loads in < 2 seconds
- [ ] No spinners stuck loading
- [ ] Player images load or show default placeholder
- [ ] No timeout errors in logs

### Data Integrity
- [ ] Player stats displaying correctly
- [ ] Contract data accurate
- [ ] Free agent status correct
- [ ] WAR removed from all views

### Cache Monitoring
```bash
# Check cache hit rate over next few hours
ssh ortiz@fenway
docker exec players-web rails runner '
  puts "Checking cache usage..."
  # Monitor logs for cache:warmup messages
'
```

## Rollback Plan (If Needed)

If critical issues arise:

### Quick Rollback
```bash
ssh ortiz@fenway

# Restore previous image
docker tag ghcr.io/jamiepinkham/players:main ghcr.io/jamiepinkham/players:backup
docker pull ghcr.io/jamiepinkham/players:PREVIOUS_TAG
docker tag ghcr.io/jamiepinkham/players:PREVIOUS_TAG ghcr.io/jamiepinkham/players:main
docker restart players-web players-sidekiq players-scheduler
```

### Database Rollback (if migrations ran)
```bash
ssh ortiz@fenway

# Restore database backup
docker exec -i players-db psql -U postgres < /tmp/players_backup_YYYYMMDD_HHMMSS.sql

# Restart services
docker restart players-web players-sidekiq players-scheduler
```

## Success Criteria

✅ All items checked above
✅ No errors in logs for 15 minutes
✅ Free agents page loads without spinners
✅ WAR removed from all views
✅ Player images load without timeouts
✅ Cache warmup runs automatically on restart

## Notes

**Estimated Deployment Time**: 30-45 minutes
**Downtime**: ~2-3 minutes during container restart
**Best Time**: Off-peak hours (late evening/early morning)

**Key Contacts**:
- Deployment issues: Check GitHub Issues
- Database concerns: Review backup before rollback

## Post-Deployment Tasks

- [ ] Update deployment log/wiki with deployment date
- [ ] Close related GitHub issues
- [ ] Update team on deployment completion
- [ ] Monitor for 24 hours for any issues
- [ ] Document any lessons learned
