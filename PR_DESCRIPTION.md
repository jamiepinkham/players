# Stats System Improvements & Cache Warmup

## Summary

This PR implements a three-tier stats fetching system that eliminates spinners on the free agents page, even after cache expiry. It also removes WAR stats, fixes player image timeouts, and includes automatic cache warmup on container startup.

## Changes

### 1. ✅ Three-Tier Stats Fetching (No More Spinners!)
- **Cache → Database → API** fallback system
- When Redis cache expires (24h), falls back to PostgreSQL (50ms) instead of slow MLB API (2-3s)
- Free agents page stays fast 24/7
- Spinners only for genuinely new players (not in database)

**Files changed:**
- `rails/app/services/stats_fetcher.rb` - Added database fallback

### 2. ✅ WAR Stats Removed
- Removed from free agents list
- Removed from player detail page
- Removed from all frontend displays

**Reason**: Baseball Reference WAR parsing broken, causing errors

**Files changed:**
- `rails/app/javascript/components/bidding/PositionPlayerList.jsx`
- `rails/app/javascript/components/bidding/PositionPlayerStatsTable.jsx`
- `rails/app/javascript/components/players/PlayerDetailPage.jsx`

### 3. ✅ Player Image Timeout Fix
- Added 5-second timeout to image fetching
- Returns default gray circle if MLB API is slow
- No more 500 errors from hanging requests

**Files changed:**
- `rails/app/services/player_image_service.rb`

### 4. ✅ Cache Warmup System
- Automatic cache warmup on container startup
- Manual warmup rake tasks for production
- Loads stats from database (fast, no API calls)

**Files added:**
- `rails/lib/tasks/cache_warmup.rake`
- `rails/bin/warmup-cache`
- `rails/CACHE_WARMUP.md`

### 5. ✅ Repository Cleanup
- Removed deployment/infrastructure files (moved to players-deployment repo)
- Clear separation: application code vs infrastructure
- Added `DOCKER.md` for local development guide

**Files removed:**
- `docker-compose.portainer.yml`, `docker-compose.portainer.test.yml`
- `stack.env.txt`, `Caddyfile.example`
- `docker/postgres/init.sh`, `db-restore/`

## Deployment to Production (Portainer)

### Prerequisites
- [ ] QA testing complete
- [ ] Database backup created
- [ ] Off-peak deployment window scheduled

### Step 1: Merge and Build

```bash
# Merge to main
git checkout main
git pull origin main
git merge jp-consolidated-fa-improvements
git push origin main

# Build frontend assets (WAR removal requires rebuild)
cd rails
npm install
npm run build
git add app/assets/builds/
git commit -m "Build frontend assets for production"
git push origin main
```

### Step 2: Wait for Docker Image Build

GitHub Actions will automatically build and push the new image:
- Monitor: https://github.com/jamiepinkham/players/actions
- Wait for build to complete (~5-10 minutes)
- New image: `ghcr.io/jamiepinkham/players:main`

### Step 3: Backup Production Database

```bash
ssh ortiz@fenway

# Backup production
docker exec players-db pg_dumpall -U postgres > /tmp/players_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh /tmp/players_backup_*.sql
```

### Step 4: Update Production Stack (Portainer)

**Via Portainer UI:**
1. Open http://fenway:9000 (via SSH tunnel)
2. Navigate to **Stacks → bmpl**
3. Click **Editor**
4. Check **"Re-pull images and redeploy"**
5. Click **"Update the stack"**
6. Wait for stack update (~2-3 minutes)

**Containers that will restart:**
- `players-web`
- `players-web-qa`
- `players-sidekiq`
- `players-sidekiq-qa`
- `players-scheduler`
- `players-scheduler-qa`

### Step 5: Populate Stats Database (First Time Only)

**If this is the first deployment with stats system:**

```bash
ssh ortiz@fenway

# Populate production database (~30 minutes)
docker exec players-web rails stats:populate

# Expected output:
# - Processed: 2,822 players
# - Created: ~1,000 new records
# - Errors: 0

# Clean up ineligible players
docker exec players-web rails players:remove_ineligible

# Expected: Removes ~1,300 players without current season stats
```

**If stats are already populated:**
- Skip this step, existing PlayerStat records will be used

### Step 6: Warm Redis Cache

```bash
ssh ortiz@fenway

# Quick warmup - top 100 free agents (5-10 seconds)
docker exec players-web rails cache:warmup_quick

# OR full warmup - all players (1-2 minutes)
docker exec players-web rails cache:warmup
```

**Note**: Cache warmup will run automatically on future restarts if you update docker-compose (see Optional section below).

### Step 7: Verify Deployment

#### Check Services Running
```bash
ssh ortiz@fenway
docker ps | grep players

# Should show:
# - players-web (running)
# - players-sidekiq (running)
# - players-scheduler (running)
```

#### Test Free Agents Page
1. Open https://players.billymartinplayersleague.com/free_agents
2. **Verify**: Players load without spinners
3. **Verify**: Stats display correctly
4. **Verify**: WAR column is NOT visible ✅
5. **Verify**: Position filters work

#### Test Player Detail Page
1. Click on any player
2. **Verify**: Stats load quickly (< 1 second)
3. **Verify**: WAR is NOT shown ✅
4. **Verify**: Player image loads (or shows default gray circle)
5. **Verify**: No 500 errors in browser console

#### Monitor Logs
```bash
ssh ortiz@fenway

# Watch for errors
docker logs -f players-web --tail 100

# Should NOT see:
# - Rack::Timeout::RequestTimeoutException
# - 500 Internal Server Error
# - Player image fetch errors
```

### Step 8: Update QA Environment (Optional)

```bash
ssh ortiz@fenway

# Pull new main image for QA
docker pull ghcr.io/jamiepinkham/players:main

# Update QA environment variable to use main
# In Portainer: Stacks → bmpl → Editor
# Change: GIT_REF=main
# Click "Update the stack"

# Warm QA cache
docker exec players-web-qa rails cache:warmup_quick
```

## Optional: Enable Automatic Cache Warmup

To prevent manual cache warmup after every restart, update the docker-compose configuration:

**See**: `~/dev/players-deployment/docs/DEPLOYMENT.md` (Cache Warmup After Restart section)

The docker-compose already has the warmup command configured:
```yaml
command: sh -c "bin/warmup-cache && bin/rails server -b 0.0.0.0"
```

This runs automatically when the new image (with warmup scripts) is deployed.

## Testing Checklist

### Before Merging
- [ ] All tests passing: `docker compose -f docker-compose.test.yml up`
- [ ] QA environment tested
- [ ] No console errors
- [ ] WAR not visible anywhere
- [ ] Cache warmup works in QA

### After Deployment
- [ ] Free agents page loads fast (< 2 seconds)
- [ ] No spinners stuck loading
- [ ] WAR removed from all views
- [ ] Player images load without timeouts
- [ ] Cache warmup ran successfully
- [ ] No errors in production logs for 15+ minutes

## Performance Improvements

### Before:
- Cache expires after 24h → 600 slow API calls → spinners everywhere
- Player images timeout → 500 errors
- Manual cache warmup required after every restart

### After:
- Cache expires → database fallback (50ms) → page loads normally ✅
- Player images timeout gracefully → default gray circle ✅
- Cache warmup runs automatically on startup ✅

## Rollback Plan

If issues arise:

### Quick Rollback (Portainer)
1. Stacks → bmpl → Editor
2. Change image tag to previous version
3. Click "Update the stack"

### Database Rollback (if needed)
```bash
ssh ortiz@fenway
docker exec -i players-db psql -U postgres < /tmp/players_backup_YYYYMMDD_HHMMSS.sql
docker restart players-web players-sidekiq players-scheduler
```

## Documentation

### Application Docs (this repo)
- `STATS_IMPORT.md` - Stats system architecture
- `rails/CACHE_WARMUP.md` - Cache warmup guide
- `DOCKER.md` - Local development guide
- `rails/SEASON_SWITCH.md` - Season switching guide

### Infrastructure Docs (players-deployment repo)
- `~/dev/players-deployment/docs/DEPLOYMENT.md` - Stack operations guide
- `~/dev/players-deployment/stack/docker-compose.consolidated.yml` - Stack configuration

## Breaking Changes

None - fully backward compatible.

## Database Migrations

None required.

## Environment Variables

No new environment variables needed.

## Dependencies

No new dependencies added (existing: pybaseball, redis, postgresql).

## Related Issues

Fixes:
- Free agents page spinners after 24 hours
- Player image 500 errors
- Empty cache after container restarts
- WAR stats display (Baseball Reference broken)

## Author Notes

**Estimated deployment time**: 45-60 minutes (including stats population)
**Downtime**: ~2-3 minutes during container restart
**Best time to deploy**: Off-peak hours

**One-time cost**: Initial `rails stats:populate` takes ~30 minutes. After that, all operations are fast.

## Questions?

See deployment documentation:
- `~/dev/players-deployment/docs/DEPLOYMENT.md`
- Or check logs: `docker logs players-web --tail 100`
