# BMPL Season Switching Process

This document outlines the steps required to transition from one season to the next in the BMPL system.

## Overview

The BMPL system tracks seasons, contracts, and free agency periods. When a season ends, several database operations must be performed to properly close out the old season and prepare for the new one.

## Season Structure

- Seasons are linked via `previous_season_id` forming a linked list
- Only one season should have `is_active = true` at a time
- Each season can have multiple free agency periods, but typically only one is active
- Use `rails season:status` to check the current active season

## Pre-Season Switch Checklist

Before switching seasons, verify the current state using the Rails console or rake task:

```bash
# Best option: Use the status rake task
docker-compose exec players rails season:status

# Or use Rails console for detailed inspection
docker-compose exec players rails console
```

```ruby
# In Rails console:

# Check current active season
Season.where(is_active: true).first
# => #<Season id: 6, name: "BMPL 2026", is_active: true>

# Check expiring contracts (for current season)
current_season = Season.current
Contract.where(active: true, last_season_id: current_season.id).count

# Check active free agency period
FreeAgencyPeriod.where(is_active: true).includes(:season).first

# Check active bids
Bid.where(is_active: true).count
```

## Season Switching Steps

### Recommended Method: Use the Rails Rake Task

The easiest and safest way to switch seasons is using the rake task:

```bash
# Preview what will happen (doesn't make changes)
docker-compose exec players rails season:preview

# Check current season status
docker-compose exec players rails season:status

# Perform the season switch (interactive, asks for confirmation)
docker-compose exec players rails season:switch
```

The rake task will:
1. Show you exactly what will be affected
2. Ask for confirmation before making changes
3. Deactivate all expiring contracts
4. Deactivate the current free agency period and bids
5. Switch to the next season
6. Create/activate the free agency period for the new season
7. Verify the changes and show you the new state

### Alternative: Manual Steps via Rails Admin UI

1. Log in to Rails Admin at `/admin`
2. Click "Deactivate Contracts" in the navigation
3. Select the ending season (BMPL 2026)
4. Confirm to deactivate all expiring contracts
5. Manually update seasons and free agency periods via Rails Admin

### Manual Steps via Rails Console (Advanced)

If you need more control, you can use the Rails console:

```ruby
# Enter Rails console
docker-compose exec players rails console

# Get current and next season
current_season = Season.current
next_season = current_season.next_season

# Deactivate expiring contracts
Contract.where(active: true, last_season_id: current_season.id).update_all(active: false)

# Deactivate free agency period and bids
current_season.free_agency_periods.where(is_active: true).update_all(is_active: false)
Bid.where(is_active: true).update_all(is_active: false)

# Switch seasons
current_season.update!(is_active: false)
next_season.update!(is_active: true)

# Create free agency period using season's dates
next_season.free_agency_periods.create!(
  is_active: true,
  max_bids_for_team: 7,
  start_date: next_season.start_date,
  end_date: next_season.end_date
)
```

### Additional Step: Import Updated Player Stats (Optional)

If you have updated player statistics for the new season:

**Via Rails Admin UI:**
1. Go to Rails Admin at `/admin`
2. Click "Import Free Agents"
3. Upload two CSV files:
   - Hitters CSV (columns: Player, BBRefID, Pos, plus stats)
   - Pitchers CSV (columns: Player, BBRefID, GS, plus stats)
4. Click Import

**Note:** This clears ALL existing `bbref_stats` first, then updates them with new data.

### Verification

After switching seasons, verify the changes:

```bash
# Best option: Use the status rake task (shows everything)
docker-compose exec players rails season:status

# Or verify manually via Rails console
docker-compose exec players rails console
```

```ruby
# In Rails console:

# Check active season
Season.current
# => #<Season id: 7, name: "BMPL 2027", is_active: true>

# Check active free agency period
fa = FreeAgencyPeriod.where(is_active: true).includes(:season).first
fa.season.name  # => "BMPL 2027"
fa.max_bids_for_team  # => 7

# Count active contracts
Contract.where(active: true).count

# Count free agents (players without active contracts)
Player
  .left_outer_joins(:contracts)
  .where(contracts: { active: [nil, false] })
  .where.not(bbref_stats: nil)
  .where("bbref_stats::text != '{}'")
  .where.not(bbrefid: [nil, ''])
  .where("bbrefid ~ '^[a-z0-9]{5,10}'")
  .distinct
  .count

# Verify no contracts from previous season are still active
old_season = Season.find(6)  # Previous season ID
Contract.where(active: true).where("last_season_id <= ?", old_season.id).count
# Should return 0
```

## Quick Reference Commands

```bash
# Check current season status
docker-compose exec players rails season:status

# Preview the next season switch
docker-compose exec players rails season:preview

# Perform the season switch
docker-compose exec players rails season:switch
```

## Post-Season Switch Tasks

1. **Notify team owners** that the new season has started
2. **Announce free agency period** opening
3. **Verify frontend** displays correct season information
4. **Test bidding system** to ensure it works for the new season
5. **Monitor for errors** in the first few hours

## Database Backup

**CRITICAL:** Always backup the database before switching seasons!

```bash
# Create backup
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)-pre-season-switch.backup"
docker-compose exec db pg_dump -U postgres -d players_development -F c -f /tmp/$BACKUP_NAME
docker cp players-db-1:/tmp/$BACKUP_NAME ~/Downloads/
docker exec players-db-1 rm /tmp/$BACKUP_NAME

# Verify backup
ls -lh ~/Downloads/$BACKUP_NAME
```

## Rollback Plan

If something goes wrong, you can restore from backup:

```bash
# Stop the application
docker-compose stop players

# Drop and recreate database
docker-compose exec db psql -U postgres -c "DROP DATABASE players_development;"
docker-compose exec db psql -U postgres -c "CREATE DATABASE players_development;"

# Copy backup to container
docker cp ~/Downloads/backup-TIMESTAMP.backup players-db-1:/tmp/restore.backup

# Restore
docker-compose exec db pg_restore -U postgres -d players_development --no-owner --verbose /tmp/restore.backup

# Clean up
docker exec players-db-1 rm /tmp/restore.backup

# Restart application
docker-compose start players
```

## Troubleshooting

### Issue: Players not showing up as free agents

**Cause:** Contract active logic may be incorrect
**Solution:** Check `Player.with_stats_or_current_contract` scope in `app/models/player.rb`

### Issue: Bidding not working

**Possible causes:**
- No active free agency period
- Free agency period max_bids_for_team is 0
- Season not marked as active

**Check via Rails console:**
```ruby
# Check season and free agency period status
season = Season.current
fa = season.free_agency_periods.where(is_active: true).first

puts "Season: #{season.name}, Active: #{season.is_active}"
puts "FA Period: #{fa ? "Active (max bids: #{fa.max_bids_for_team})" : "None"}"
```

### Issue: Old contracts still showing as active

**Solution via Rails console:**
```ruby
# Find contracts that should be expired
current_season = Season.current
expired_contracts = Contract
  .where(active: true)
  .where("last_season_id < ?", current_season.id)
  .includes(:player, :team, :last_season)

# Review them
expired_contracts.each do |c|
  puts "#{c.player.name} (#{c.team.name}) - ends #{c.last_season.name}"
end

# Deactivate them
expired_contracts.update_all(active: false)

# Verify
Contract.where(active: true).where("last_season_id < ?", current_season.id).count
# Should return 0
```

## Related Files

- **Season Rake Tasks:** `rails/lib/tasks/season.rake` (automated season switching)
- **Season Model:** `rails/app/models/season.rb`
- **Contract Model:** `rails/app/models/contract.rb`
- **Player Model:** `rails/app/models/player.rb`
- **Free Agency Period Model:** `rails/app/models/free_agency_period.rb`
- **Deactivate Contracts Action:** `rails/lib/rails_admin/deactivate_contracts.rb`
- **Import Free Agents Action:** `rails/lib/rails_admin/import_free_agents.rb`
- **Dev Rake Tasks:** `rails/lib/tasks/dev.rake`

## Notes

- The system uses a linked list structure for seasons via `previous_season_id`
- Free agency periods are separate from seasons and have their own active flag
- Contracts are considered active based on both the `active` column AND the season range
- The `Player.with_stats_or_current_contract` scope determines which players appear in searches

## Available Rake Tasks

Season management rake tasks are available in `rails/lib/tasks/season.rake`:

- **`season:status`** - Shows current season info, contract counts, and all seasons
- **`season:preview`** - Preview what will happen in the next season switch without making changes
- **`season:switch`** - Performs the complete season switch with confirmation prompts

These tasks use Rails domain models and follow all validations and business logic.

---

**Last Updated:** 2026-01-23
**Document Version:** 2.0 (Rails domain code only)
