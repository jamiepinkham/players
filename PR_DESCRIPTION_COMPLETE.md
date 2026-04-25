# Consolidated Free Agency & Stats System Improvements

## Overview

This PR consolidates multiple feature branches with major improvements to free agency, bidding, stats system, and UI/UX. It includes automatic cache warmup, three-tier stats fetching, and comprehensive free agency workflow enhancements.

## 🎯 Free Agency & Bidding Improvements

### Bid Conversion System
- **Admin notifications** for bid conversions
- **15% home team discount** for re-signing players
- Improved bid conversion workflow
- Budget info display on bidding page

**Files changed:**
- `rails/app/models/bid.rb`
- `rails/app/services/bid_conversion_service.rb`
- Free agency rake tasks

### Free Agent Flag & Stats Validation
- Automatic `is_free_agent` flag based on stats availability
- Players without current season stats marked ineligible
- Validation via pybaseball stats
- Cleanup task to remove ineligible players

**Files changed:**
- `rails/app/models/player.rb`
- `rails/lib/tasks/cleanup_ineligible_players.rake`

### Bidding Page UI/UX
- **Fixed layout jumping** when content loads
- **Fixed search input losing focus** after keystroke
- **Fixed overflow issues** on bidding page
- **Collapsible summary** for trades and pending bids
- **Budget info** properly displayed
- **Loading spinners** for stats (async fetch)

**Files changed:**
- `rails/app/javascript/components/bidding/PlaceBid.jsx`
- `rails/app/javascript/components/bidding/PositionPlayerList.jsx`
- Various bidding components

## 📊 Stats System (Three-Tier Architecture)

### Cache → Database → API Fallback
- **Tier 1**: Redis cache (1-10ms) - fastest
- **Tier 2**: PlayerStat database (10-50ms) - prevents spinners after cache expiry
- **Tier 3**: MLB Stats API (2-3s) - only for genuinely new players

**Result**: Free agents page stays fast even after 24-hour cache expiry!

**Files changed:**
- `rails/app/services/stats_fetcher.rb`
- `rails/app/models/player_stat.rb`
- `rails/app/jobs/fetch_player_stats_job.rb`

### WAR Stats Removed
- Removed from free agents list
- Removed from player detail pages
- Removed from all frontend displays

**Reason**: Baseball Reference WAR parsing broken

**Files changed:**
- `rails/app/javascript/components/bidding/PositionPlayerList.jsx`
- `rails/app/javascript/components/bidding/PositionPlayerStatsTable.jsx`
- `rails/app/javascript/components/players/PlayerDetailPage.jsx`

### Player Stats & Detail Pages
- Complete player detail page implementation
- Player avatars/images with fallback
- Historical stats by season
- Position-specific stat displays

**Files added:**
- `rails/app/javascript/components/players/PlayerDetailPage.jsx`
- `rails/app/javascript/components/players/PlayerAvatar.jsx`
- `rails/app/services/player_image_service.rb` (with 5s timeout fix)

### Cache Warmup System
- **Automatic warmup** on container startup
- **Manual warmup** rake tasks
- Loads stats from database (no slow API calls)
- Quick warmup: 5-10 seconds (100 free agents)
- Full warmup: 1-2 minutes (all players)

**Files added:**
- `rails/lib/tasks/cache_warmup.rake`
- `rails/bin/warmup-cache`
- `rails/CACHE_WARMUP.md`

## 🎨 UI/UX Improvements

### Mobile Responsiveness
- **Hamburger navigation** for all screen sizes
- Mobile-first design approach
- Responsive layouts across all pages
- Flexible viewport handling

**Files changed:**
- `rails/app/javascript/components/HamburgerNav.jsx` (renamed from MobileNav)
- Layout components across app

### Layout Fixes
- **Fixed viewport width issues**
- **Fixed scroll handling** (no more jumpiness)
- **Fixed filter row layouts** on All Trades and Player Search
- **Removed confusing back buttons**
- **Consistent flex layout** across all pages

**Files changed:**
- `rails/app/javascript/components/Layout.jsx`
- `rails/app/javascript/components/trades/AllTrades.jsx`
- `rails/app/javascript/components/players/PlayerSearch.jsx`

### Trade UI Improvements
- **Collapsible summary** for pending trades
- Better trade console layout
- Improved filter alignment
- Cleaned up filter row components

**Files changed:**
- `rails/app/javascript/components/trades/` (multiple files)

## ⚙️ Season & Admin Improvements

### Season Switching
- Improved season switch workflow
- Automatic free agent flag updates
- Stats validation for new season
- Better documentation

**Files changed:**
- `rails/lib/tasks/season_management.rake`
- `rails/SEASON_SWITCH.md`

### Scheduler Improvements
- **Midnight Eastern Time** instead of UTC
- Proper timezone handling
- Consistent scheduling

**Files changed:**
- `rails/config/schedule.rb`

### Admin Tools
- Hide PlayerStat model from Rails Admin (internal use only)
- Database utility scripts with parameters
- Cleanup tasks for production deployment

**Files changed:**
- `rails/config/initializers/rails_admin.rb`
- Database utility scripts

## 🧹 Repository Cleanup

### Removed Deployment Files
- `docker-compose.portainer.yml` (moved to players-deployment)
- `docker-compose.portainer.test.yml`
- `stack.env.txt`
- `Caddyfile.example`
- `docker/postgres/init.sh`
- `db-restore/` folder

### Added Documentation
- `DOCKER.md` - Local development guide
- `STATS_IMPORT.md` - Stats system architecture (updated)
- `rails/CACHE_WARMUP.md` - Cache warmup guide

### Clear Separation
- **`~/dev/players`** = Application code only
- **`~/dev/players-deployment`** = Infrastructure configs

## 🚀 Deployment to Production (Portainer)

### Prerequisites
- [ ] QA testing complete
- [ ] Database backup created
- [ ] Off-peak deployment window

### Step 1: Merge and Build Frontend

```bash
# Merge to main
git checkout main
git pull origin main
git merge jp-consolidated-fa-improvements
git push origin main

# Build frontend assets (required for WAR removal, UI fixes)
cd rails
npm install
npm run build
git add app/assets/builds/
git commit -m "Build frontend assets for production"
git push origin main
```

### Step 2: Wait for Docker Image Build

Monitor: https://github.com/jamiepinkham/players/actions
- Wait for build to complete (~5-10 minutes)
- New image: `ghcr.io/jamiepinkham/players:main`

### Step 3: Backup Production Database

```bash
ssh ortiz@fenway
docker exec players-db pg_dumpall -U postgres > /tmp/players_backup_$(date +%Y%m%d_%H%M%S).sql
ls -lh /tmp/players_backup_*.sql  # Verify backup
```

### Step 4: Update Stack via Portainer

1. Open http://fenway:9000 (via SSH tunnel)
2. **Stacks → bmpl → Editor**
3. Check **"Re-pull images and redeploy"**
4. Click **"Update the stack"**
5. Wait ~2-3 minutes for restart

**Containers restarting:**
- players-web, players-web-qa
- players-sidekiq, players-sidekiq-qa
- players-scheduler, players-scheduler-qa

### Step 5: Run Database Migrations (if any)

```bash
ssh ortiz@fenway
docker exec players-web rails db:migrate:status
docker exec players-web rails db:migrate  # If needed
```

### Step 6: Populate Stats Database (First Time Only)

**If PlayerStat table is empty:**

```bash
ssh ortiz@fenway

# Populate stats (~30 minutes, one-time cost)
docker exec players-web rails stats:populate

# Expected: ~1,000 new PlayerStat records created

# Clean up ineligible players
docker exec players-web rails players:remove_ineligible

# Expected: ~1,300 players removed (no current season stats)
```

**If stats already exist**: Skip this step

### Step 7: Warm Redis Cache

```bash
ssh ortiz@fenway

# Quick warmup (5-10 seconds)
docker exec players-web rails cache:warmup_quick

# OR full warmup (1-2 minutes)
docker exec players-web rails cache:warmup
```

**Note**: Future restarts will auto-warmup if docker-compose updated (see below).

### Step 8: Verify Deployment

#### Test Free Agency & Bidding
1. Open https://players.billymartinplayersleague.com/free_agents
2. **Verify**: Players load fast (no spinners)
3. **Verify**: Stats display correctly
4. **Verify**: WAR column NOT visible ✅
5. **Verify**: Position filters work
6. **Verify**: Search doesn't lose focus
7. **Verify**: Budget info displays
8. **Verify**: Layout doesn't jump when loading

#### Test Player Detail Pages
1. Click any player
2. **Verify**: Player detail page loads
3. **Verify**: Stats display (no WAR)
4. **Verify**: Player image loads or shows default
5. **Verify**: No console errors

#### Test Bidding Flow
1. Try to place a bid
2. **Verify**: Budget calculations correct
3. **Verify**: 15% home team discount applies (if applicable)
4. **Verify**: Bid conversion works
5. **Verify**: Admin notifications sent

#### Monitor Logs
```bash
ssh ortiz@fenway
docker logs -f players-web --tail 100

# Should NOT see:
# - Timeout errors
# - 500 errors
# - Player image failures
```

### Step 9: Optional - Enable Auto Cache Warmup

Update `~/dev/players-deployment/stack/docker-compose.consolidated.yml`:

```yaml
players-web:
  command: sh -c "bin/warmup-cache && bin/rails server -b 0.0.0.0"
```

Already configured in deployment repo - will work automatically with new image!

## 📋 Testing Checklist

### Before Merge
- [ ] All RSpec tests pass
- [ ] QA environment validated
- [ ] No console errors
- [ ] WAR removed from all pages
- [ ] Free agency workflow tested
- [ ] Bidding workflow tested
- [ ] Cache warmup works
- [ ] Mobile responsive on real device

### After Production Deployment
- [ ] Free agents page loads < 2 seconds
- [ ] No spinners stuck
- [ ] Stats accurate
- [ ] WAR not visible
- [ ] Bidding works (budget, discounts)
- [ ] Player images load
- [ ] Search input keeps focus
- [ ] Layout stable (no jumping)
- [ ] Mobile navigation works
- [ ] No errors in logs (15+ min)

## 📈 Performance Improvements

### Before:
- Cache expires → 600 slow API calls → spinners everywhere (30+ min)
- Free agents page slow after 24 hours
- Player images timeout → 500 errors
- Bidding page jumps when loading
- Search loses focus on each keystroke
- Manual cache warmup after every restart

### After:
- Cache expires → database fallback (50ms) → instant load ✅
- Free agents page always fast (24/7) ✅
- Player images timeout gracefully → default image ✅
- Bidding page stable (no layout shift) ✅
- Search maintains focus ✅
- Auto cache warmup on startup ✅

## 🔄 Rollback Plan

### Via Portainer
1. Stacks → bmpl → Editor
2. Change to previous image tag
3. Click "Update the stack"

### Database Rollback
```bash
ssh ortiz@fenway
docker exec -i players-db psql -U postgres < /tmp/players_backup_YYYYMMDD_HHMMSS.sql
docker restart players-web players-sidekiq players-scheduler
```

## 📚 Documentation

### Application (this repo)
- `STATS_IMPORT.md` - Stats architecture
- `rails/CACHE_WARMUP.md` - Cache warmup
- `rails/SEASON_SWITCH.md` - Season switching
- `DOCKER.md` - Local development

### Infrastructure (players-deployment)
- `~/dev/players-deployment/docs/DEPLOYMENT.md`
- `~/dev/players-deployment/stack/docker-compose.consolidated.yml`

## Breaking Changes

None - fully backward compatible.

## Database Migrations

Check with: `docker exec players-web rails db:migrate:status`

## Dependencies

No new dependencies (existing: pybaseball, redis, postgresql).

## Related Issues

Fixes:
- Free agents page spinners after 24 hours
- Bidding page layout issues
- Player image 500 errors
- Search input focus loss
- Empty cache after restarts
- WAR stats display
- Budget info missing
- Mobile navigation
- Layout jumpiness

## Deployment Estimate

- **Time**: 45-60 minutes (including one-time stats population)
- **Downtime**: 2-3 minutes (container restart)
- **Best time**: Off-peak hours
- **One-time cost**: `rails stats:populate` (~30 min first deployment only)

## Questions?

See: `~/dev/players-deployment/docs/DEPLOYMENT.md`
Logs: `docker logs players-web --tail 100`
