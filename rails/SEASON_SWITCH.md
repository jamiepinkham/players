# Season Switch Workflow

This document describes the end-of-season workflow for switching from one BMPL season to the next.

## Overview

The season switch process consists of three main steps:

1. **Import Stats** - Fetch player statistics from Baseball Reference
2. **Promote Free Agents** - Preview and promote players to free agent status
3. **Switch Season** - Deactivate contracts and switch to the next season

## Step 1: bin/rails stats:import

### What it does:

- Fetches player stats from Baseball Reference via pybaseball
- Uses current season's `target_stat_year` to determine which MLB season to import
- Example: BMPL 2026 season has `target_stat_year: 2025` (uses 2025 MLB stats)
- Stores stats in `player_stats` table (one row per player per season)
- Handles UTF-8 encoding for accented player names
- Updates player positions based on fielding data and playing time

### When to run:

- After Baseball Reference/pybaseball has stats for the upcoming season
- Typically: late fall/early winter after MLB season concludes
- Can be re-run safely if new players are added or stats updated

### Expected output:

```
Importing stats for 623 free agents (2025)...
Fetching stats from Baseball Reference (2025)...
  Batting: 487 players
  Pitching: 312 players
  Fielding positions: 458 players

✓ Import complete!
  487 new player stat records created
  136 existing records updated
  623 players matched to Baseball Reference

  ⚠️  12 players missing WAR (FanGraphs lookup failed via Chadwick Register):
    - Dedniel Núñez (nunezde01)
  These players have counting stats but no WAR - still eligible for free agency
```

**Time:** ~2-5 minutes depending on network speed

---

## Step 2: bin/rails season:promote_free_agents

### What it does:

- Finds all contracts expiring at end of current season
- For each player, checks if they have stats for NEXT season's target year
- Uses position-appropriate validation: IP > 0 (pitchers), PA > 0 (position players)
- Shows preview with two lists: ELIGIBLE (will become FA) and INELIGIBLE (no stats)
- Asks for confirmation before making changes
- Sets `is_free_agent = true` for players with stats
- Skips players without stats (they stay `is_free_agent = false`)

### When to run:

- After stats import is complete
- Before season switch
- Typically: right before you're ready to switch seasons

### Expected output:

```
🔍 FREE AGENT PROMOTION PREVIEW
================================================================================

📅 Promoting for: BMPL 2027
📊 Target stat year: 2026
✓ Found 1,060 player stat records for 2026

ELIGIBLE (will become FA):
  ✓ Mike Trout (OF) from Angels
  ✓ Aaron Judge (OF) from Yankees
  ... (16 more)

INELIGIBLE (no stats for 2026):
  ✗ Joe Veteran (1B) from Red Sox
  ... (2 more)

================================================================================
Summary:
  18 players will become free agents
  3 players will NOT become free agents (no stats)

⚠️  This will set is_free_agent = true for 18 players.
   Continue? (yes/no): yes

🚀 Promoting free agents...

  ✓ Mike Trout promoted to free agent
  ✓ Aaron Judge promoted to free agent
  ✗ Joe Veteran NOT promoted (no stats for 2026)
  ... (continues for all expiring contracts)

================================================================================
✅ Promoted 18 players to free agent status
```

**Time:** ~30 seconds
**Safety check:** Won't run if no stats found for target year
**Important:** This is when players actually become free agents in the system

---

## Step 3: bin/rails season:switch

### What it does:

- Deactivates all contracts expiring this season (`active = false`)
- Deactivates current season's free agency periods
- Deactivates all active bids
- Sets current season to `is_active = false`
- Sets next season to `is_active = true`
- Creates free agency period for new season (inactive by default)
- Shows verification stats after completion

**Note:** The free agency period is created as **inactive**. League admins must manually activate it when ready to start free agency (via Rails Admin or console).

### When to run:

- After promoting free agents
- This is the "big switch" - league moves to next season
- Typically: when you're ready to start next season's free agency

### Expected output:

```
🔄 BMPL Season Switch
================================================================================

📅 Current Season: BMPL 2026 (ID: 5)
📅 Next Season:    BMPL 2027 (ID: 6)

📊 Current State:
   • Expiring contracts: 18
   • Active free agency periods: 1
   • Active bids: 45

⚠️  This will deactivate 18 contracts and switch seasons.
   Continue? (yes/no): yes

🚀 Starting season switch...

Step 1: Deactivating expiring contracts...
   Progress: 18/18
   ✓ Deactivated 18 contracts

Step 2: Deactivating current free agency periods...
   ✓ Deactivated 1 free agency periods

Step 3: Deactivating active bids...
   ✓ Deactivated 45 bids

Step 4: Switching active season...
   ✓ BMPL 2026 marked inactive
   ✓ BMPL 2027 marked active

Step 5: Creating free agency period for BMPL 2027...
   ✓ Free agency period already exists (ID: 12)
   ℹ️  Status: INACTIVE

================================================================================
✅ Season switch complete!
================================================================================

📊 New State:
   • Active season: BMPL 2027
   • Active contracts: 578
   • Free agents: 624
   • Active free agency period: None (activate when ready to start FA)

🔍 Verification:
   ✓ No contracts from old season are active

📝 Next Steps:
   1. Test the application
   2. Activate free agency period when ready (via Rails Admin or console)
   3. Notify team owners that the new season has started
   4. Monitor for any issues
```

**Time:** ~1-2 minutes (asks for confirmation)
**Important:** This is irreversible without database restore - make sure the promotion looked correct!

---

## Quick Reference

```bash
# Complete season switch workflow:
bin/rails stats:import                    # Step 1: Import stats
bin/rails season:promote_free_agents      # Step 2: Preview and promote FAs
bin/rails season:switch                   # Step 3: Switch to next season

# Additional helper commands:
bin/rails season:status                   # Show current season info
bin/rails season:preview                  # Preview season switch impact
bin/rails free_agents:recalculate         # Recalculate all FA statuses
bin/rails free_agents:stats               # Show FA statistics
```

## Activating Free Agency

After running `season:switch`, the free agency period is created but **inactive** by default. This allows league admins to control when bidding opens.

### Via Rails Admin:
1. Navigate to Free Agency Periods in Rails Admin
2. Find the period for the new season
3. Edit and set `is_active` to `true`
4. Save

### Via Rails Console:
```ruby
fa_period = FreeAgencyPeriod.find_by(season: Season.current)
fa_period.update!(is_active: true)
```

**Important:** Teams cannot place bids until the free agency period is active. The GraphQL mutation will return an error: "no active free agency period"

## Troubleshooting

### No stats found for target year
If you see "No stats found for target year", ensure:
1. The next season has `target_stat_year` configured
2. You've run `bin/rails stats:import` successfully
3. The stats were imported for the correct year

### Players not becoming free agents
If players aren't being promoted:
1. Check that they have stats in the database for the target year
2. Verify their position is set correctly
3. Ensure they meet the minimum thresholds (PA > 0 or IP > 0)

### Need to undo a promotion
If you accidentally promoted players:
```bash
bin/rails free_agents:recalculate
```
This will recalculate all free agent statuses based on current contracts and stats.
