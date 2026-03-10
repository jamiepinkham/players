# Deployment Manual: jp/consolidated-fa-improvements → main

## Overview
This deployment includes free agency improvements, stats system overhaul, home team discount feature, UI/UX enhancements, and mobile responsiveness updates.

**Branch:** `jp/consolidated-fa-improvements`
**Target:** `main`
**Estimated Deployment Time:** 15-20 minutes
**Downtime Required:** Yes (~5 minutes for migrations)

---

## Pre-Deployment Checklist

### 1. Verify Branch Status
```bash
git checkout jp/consolidated-fa-improvements
git pull origin jp/consolidated-fa-improvements
git log main..HEAD --oneline  # Review commits
```

### 2. Backup Database (CRITICAL)
```bash
# Production backup
./sync-prod-db.sh  # or your production backup script

# Or manual backup:
docker-compose exec db pg_dump -U postgres players_production > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Check Dependencies
- ✅ Python 3 + pybaseball installed (for stats fetching)
- ✅ Redis running (for stats caching)
- ✅ PostgreSQL running
- ✅ Docker and docker-compose available

### 4. Review Critical Changes
- **New Feature:** Home team discount (15% for re-signings)
- **Database Changes:** PlayerStat model, position array migration
- **Breaking Changes:** None (backward compatible)

---

## Deployment Steps

### Step 1: Merge to Main
```bash
# Switch to main and merge
git checkout main
git pull origin main
git merge jp/consolidated-fa-improvements

# Review merge result
git log -5 --oneline
```

### Step 2: Update Dependencies
```bash
cd rails

# Update Ruby gems
bundle install

# Update JavaScript packages (if needed)
npm install  # or yarn install
```

### Step 3: Run Database Migrations

**IMPORTANT:** These migrations modify the database schema. Review before running in production.

```bash
# Check pending migrations
docker-compose exec players bin/rails db:migrate:status

# Run migrations (this will cause brief downtime)
docker-compose exec players bin/rails db:migrate

# Expected migrations:
# - 20260203065548_create_player_stats.rb
# - 20260203095419_remove_is_free_agent_from_players.rb
# - 20260204025159_add_is_free_agent_to_players.rb
# - 20260204061654_add_default_to_free_agency_period_is_active.rb
# - 20260219011831_change_position_to_positions_array.rb
```

**Migration Details:**
- `create_player_stats`: Adds `player_stats` table for caching stats
- `remove_is_free_agent_from_players`: Temporary removal
- `add_is_free_agent_to_players`: Re-adds with proper defaults
- `add_default_to_free_agency_period_is_active`: Sets FA period active flag default
- `change_position_to_positions_array`: Converts `position` (string) → `positions` (array)

### Step 4: Rebuild Docker Images (if needed)
```bash
# If Dockerfile or dependencies changed
docker-compose build

# Restart containers
docker-compose down
docker-compose up -d
```

### Step 5: Precompile Assets (Production)
```bash
# In production environment
RAILS_ENV=production bin/rails assets:precompile

# Or via Docker
docker-compose exec players bin/rails assets:precompile
```

### Step 6: Warm Redis Cache (Optional but Recommended)
```bash
# Warm stats cache for all free agents
docker-compose exec players bin/rails stats:import

# This takes ~2-5 minutes and improves first page load
```

---

## Post-Deployment Verification

### 1. Health Checks
```bash
# Check all services are running
docker-compose ps

# Check logs for errors
docker-compose logs --tail=100 players
docker-compose logs --tail=50 redis
docker-compose logs --tail=50 db

# Verify database connection
docker-compose exec players bin/rails runner "puts Player.count"
```

### 2. Feature Testing

#### Test Home Team Discount
```bash
docker-compose exec players bin/rails runner "
# Find a player with expiring contract
contract = Contract.where(last_season_id: Season.current.previous_season&.id).first
if contract
  puts \"Test player: #{contract.player.name} (#{contract.team.name})\"
  puts \"Old contract: \$#{contract.amount}\"
  puts \"Would get 15% discount if re-signed: \$#{contract.amount * 0.85}\"
end
"
```

#### Test Stats System
```bash
# Test stats fetching for a known player
docker-compose exec players bin/rails runner "
player = Player.where.not(bbrefid: nil).first
puts \"Testing stats for: #{player.name} (#{player.bbrefid})\"
# Stats will be fetched on-demand via GraphQL
"
```

#### Test Free Agent Status
```bash
docker-compose exec players bin/rails runner "
fa_count = Player.where(is_free_agent: true).count
puts \"Free agents: #{fa_count}\"
"
```

### 3. UI Testing Checklist
- [ ] Load bidding page - verify budget info displays
- [ ] Load trades page - verify drag/drop trade builder works
- [ ] Load player search - verify stats display correctly
- [ ] Test on mobile device - verify hamburger menu works
- [ ] Test filter rows - verify alignment is correct
- [ ] Test pending trades - verify collapsible summaries work

### 4. Critical Functionality Tests
```bash
# Test bid conversion (use staging/test environment first!)
docker-compose exec players bin/rails runner "
# This is a test - don't run in production during active FA
# FreeAgencyPeriod.current&.convert_bids
puts 'Bid conversion logic ready'
"
```

---

## Configuration Changes

### Environment Variables (if needed)
No new environment variables required, but verify existing:
```bash
DATABASE_NAME=players_production
DATABASE_HOST=db
DATABASE_USER=postgres
DATABASE_PASSWORD=<your-password>
REDIS_URL=redis://redis:6379/0
```

### Scheduler Updates
The scheduler now runs at **midnight Eastern Time** instead of UTC. Verify:
```bash
# Check whenever/schedule.rb or cron jobs
cat config/schedule.rb  # if using whenever gem
```

---

## Rollback Procedure

### If Issues Occur During Deployment:

#### 1. Rollback Code
```bash
git checkout main
git reset --hard origin/main  # Revert merge
docker-compose restart players
```

#### 2. Rollback Database (if migrations ran)
```bash
# Restore from backup
docker-compose exec -T db psql -U postgres players_production < backup_YYYYMMDD_HHMMSS.sql

# Or rollback specific migrations
docker-compose exec players bin/rails db:rollback STEP=5
```

#### 3. Clear Redis Cache (if needed)
```bash
docker-compose exec redis redis-cli FLUSHDB
```

### Rollback Risks:
- **Position field migration** - Rolling back will convert `positions` array back to `position` string (may lose multi-position data)
- **PlayerStat table** - Rolling back will drop the table (Redis cache will still work)
- **Home team discount** - Rolling back removes discount logic (existing contracts unaffected)

---

## Known Issues & Gotchas

### 1. Position Migration
The `position` → `positions` migration converts single positions to arrays. Ensure:
- GraphQL queries expect `positions` (array) not `position` (string)
- UI components handle array display
- **Already fixed in this branch ✅**

### 2. Stats Caching
- First stats request for a player will be slow (~500ms) while fetching from FanGraphs
- Subsequent requests are fast (~1-10ms) from Redis cache
- Cache expires after 24 hours
- Run `stats:import` to pre-warm cache

### 3. Home Team Discount
- Only applies to immediate re-signings (no gap years)
- Respects league minimums (won't go below)
- Check bid conversion emails to verify discount notifications

### 4. Free Agent Boolean Flag
- Players need valid stats to become free agents
- Run `season:promote_free_agents` to batch-update status
- Check `player_stats` table for eligibility data

---

## Performance Considerations

### Database Queries
- New indexes added for `players` and `contracts` tables
- Position array field may affect query performance slightly
- Monitor slow query logs after deployment

### Redis Memory
- Stats cache grows with player count
- ~1-2 KB per player per season
- Monitor Redis memory usage: `docker-compose exec redis redis-cli INFO memory`

### Asset Size
- New drag/drop trade builder adds ~50KB to bundle
- Precompile assets to optimize load time

---

## Success Criteria

Deployment is successful when:
- ✅ All migrations complete without errors
- ✅ All Docker containers running healthy
- ✅ No errors in application logs
- ✅ Bidding page loads with budget info
- ✅ Stats display correctly on player pages
- ✅ Home team discount applies in bid conversion
- ✅ Free agent count matches expected number
- ✅ Mobile UI works (hamburger menu, responsive layout)

---

## Post-Deployment Tasks

### Within 24 Hours:
1. Monitor error logs for unexpected issues
2. Watch for user feedback on new features
3. Verify bid conversion works correctly (if FA period active)
4. Check Redis cache hit rate: `docker-compose exec redis redis-cli INFO stats`

### Within 1 Week:
1. Review database query performance
2. Optimize any slow queries identified
3. Gather feedback on mobile responsiveness
4. Consider adjusting home team discount % if needed

---

## Support & Escalation

### If Issues Arise:
1. Check logs: `docker-compose logs --tail=200 players`
2. Review recent commits: `git log -10 --oneline`
3. Check GitHub issues: https://github.com/anthropics/claude-code/issues
4. Rollback if critical (see Rollback Procedure above)

### Emergency Contacts:
- Add your team contact info here

---

## Appendix: Key File Changes

### Models Modified:
- `rails/app/models/contract.rb` - Added home team discount logic
- `rails/app/models/player.rb` - Updated for is_free_agent flag and positions array
- `rails/app/models/player_stat.rb` - NEW: Stats caching model
- `rails/app/models/free_agency_period.rb` - Improved bid conversion

### UI Components Modified:
- `rails/app/javascript/components/bidding/PositionPlayerList.jsx` - Enhanced bidding UI
- `rails/app/javascript/components/trades/DragDropTradeBuilder.jsx` - NEW: Drag/drop trades
- `rails/app/javascript/components/HamburgerNav.jsx` - NEW: Mobile navigation
- 15+ other component improvements

### Documentation Added:
- `STATS_IMPORT.md` - Stats system documentation
- `rails/SEASON_SWITCH.md` - Season workflow guide
- `DEPLOYMENT.md` - This file

---

**Deployment prepared by:** Claude Code
**Date:** 2026-03-09
**Branch:** jp/consolidated-fa-improvements
**Commits:** 30+ commits (see `git log main..HEAD`)
