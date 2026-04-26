# Commissioner Runbook - Season Management

This guide provides step-by-step instructions for league commissioners to manage BMPL seasons, including free agent identification, season switching, and free agency activation.

## Table of Contents

- [Overview](#overview)
- [Annual Season Workflow](#annual-season-workflow)
- [Free Agent Management](#free-agent-management)
- [Season Switching](#season-switching)
- [Free Agency Activation](#free-agency-activation)
- [Troubleshooting](#troubleshooting)
- [Quick Reference](#quick-reference)

---

## Overview

### Key Concepts

- **Target Stat Year**: The MLB season year used for player eligibility
  - Example: BMPL 2026 uses `target_stat_year: 2025` (2025 MLB stats)
- **Free Agent**: A player with NO active contract AND stats in the current season's target year
- **Stats Sources**: Player statistics are fetched from Baseball Reference via pybaseball library
- **Two Workflows**: Automated (rake task) and Manual (RailsAdmin override)

### System Components

1. **RailsAdmin** - Web UI for data management (`/admin`)
2. **Rake Tasks** - Command-line tools for bulk operations
3. **Redis Cache** - Temporary storage for player stats (24-hour expiry)
4. **Database** - Permanent storage for player records and contracts

---

## Annual Season Workflow

Follow this sequence at the start of each BMPL season:

```
1. Prepare Next Season (October/November)
   ↓
2. Import Stats (December, after MLB season)
   ↓
3. Identify Free Agents (January)
   ↓
4. Switch Season (January)
   ↓
5. Activate Free Agency (When Ready)
```

---

## Free Agent Management

### Option A: Automated Free Agent Identification (Recommended)

Use this for bulk identification of all eligible free agents:

```bash
bin/rails free_agents:recalculate
```

**What it does:**
- Checks every player in the database
- Marks as free agent if: NO active contract AND has stats in target year
- Stats are checked via pybaseball (Baseball Reference data)
- Safe to run multiple times - will recalculate based on current state

**When to use:**
- Beginning of each season
- After importing new players
- After contract changes
- When you suspect free agent statuses are incorrect

**Example output:**
```
RECALCULATING FREE AGENT STATUS FOR ALL PLAYERS
================================================================================

Target stat year: 2025
Stats will be fetched on-demand from pybaseball via StatsFetcher

Free agents before: 580

  Mike Trout: set to FA (no contract, has stats)
  Joe Veteran: removed from FA (no stats)
  ... (continues for all changed players)

================================================================================
Free agents after: 624
Changed: 47
```

**Time:** 2-5 minutes depending on database size

---

### Option B: Manual Free Agent Management

For individual player adjustments:

1. **Navigate to RailsAdmin:**
   - Go to `/admin`
   - Click **Players** in sidebar

2. **Find the player:**
   - Use search box or filter

3. **Edit player record:**
   - Click **Edit**
   - Toggle **Free Agent Status** checkbox
   - **Note:** Cannot set to FA if player has active contract (validation prevents this)
   - Click **Save**

**When to use:**
- Override edge cases (player with stats but shouldn't be FA)
- Quick fixes for individual players
- Testing/debugging

---

### Viewing Free Agent Statistics

Check current free agent counts:

```bash
bin/rails free_agents:stats
```

**Output:**
```
Free Agent Statistics:
  Total Players: 1,847
  Free Agents: 624
  Under Contract: 596
  Ineligible: 627
```

---

## Season Switching

### Prerequisites

Before switching seasons, ensure:

1. ✅ Next season exists in database
2. ✅ Next season has `target_stat_year` configured
3. ✅ Stats have been imported for target year (optional but recommended)
4. ✅ Current season's `next_season` links to the next season
5. ✅ You have database backup (season switch is irreversible without restore!)

### Step 1: Preview the Switch

See what will happen without making changes:

```bash
bin/rails season:preview
```

**Shows:**
- Which contracts will expire
- How many bids will be deactivated
- Teams affected
- Salary freed up

**Example output:**
```
📋 Contracts Expiring (will be deactivated):

  Angels (3 players, $45,000,000)
    • Mike Trout             OF       $30,000,000
    • Shohei Ohtani          DH/SP    $12,000,000
    • Patrick Sandoval       SP       $3,000,000

  Yankees (2 players, $58,000,000)
    • Aaron Judge            OF       $40,000,000
    ... and more

📊 Summary:
  • Total expiring: 18 contracts
  • Teams affected: 12
  • Total salary freed: $387,000,000
```

**Time:** ~10 seconds

---

### Step 2: Promote Expiring Players to Free Agents (Optional)

This step identifies which expiring players will become free agents in the NEW season:

```bash
bin/rails season:promote_free_agents
```

**What it does:**
- Finds all contracts expiring in current season
- For each player, checks if they have stats in NEXT season's target year
- Shows preview with ELIGIBLE and INELIGIBLE lists
- Asks for confirmation
- Sets `is_free_agent = true` for eligible players

**Example output:**
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
   Continue? (yes/no):
```

**When to use:**
- If you want to review expiring players before switching
- To see who will/won't be eligible in the new season

**Alternative:**
- Skip this and run `free_agents:recalculate` after season switch

**Time:** ~30 seconds

---

### Step 3: Switch to Next Season

Execute the season switch:

```bash
bin/rails season:switch
```

**What it does:**
1. Deactivates all contracts expiring in current season
2. Deactivates current season's free agency periods
3. Deactivates all active bids
4. Marks current season as inactive
5. Marks next season as active
6. Creates free agency period for new season (INACTIVE by default)

**Example output:**
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
```

**⚠️ WARNING:** This operation is irreversible without database restore!

**Time:** ~1-2 minutes (includes confirmation prompt)

---

### Step 4: Verify the Switch

Check current season status:

```bash
bin/rails season:status
```

**Output:**
```
📅 BMPL Season Status
================================================================================

✓ Active Season: BMPL 2027 (ID: 6)
  Previous: BMPL 2026
  Next: BMPL 2028

📊 Statistics:
  • Active contracts: 578
  • Expiring this season: 12
  • Free agency period: None active
  • Active bids: 0

📋 All Seasons:
  ✓ ACTIVE BMPL 2027         (ID: 6)
    BMPL 2026         (ID: 5)
    BMPL 2025         (ID: 4)
```

---

### Step 5: Recalculate Free Agent Statuses

After season switch, update free agent statuses for new season:

```bash
bin/rails free_agents:recalculate
```

This ensures all free agent flags are correct for the new season's target year.

---

## Free Agency Activation

After season switch, the free agency period is created but **INACTIVE**. This allows you to control when bidding opens.

### Activate via RailsAdmin (Recommended)

1. Navigate to `/admin`
2. Click **Free Agency Periods** in sidebar
3. Find the period for the new season
4. Click **Edit**
5. Check the **Is Active** checkbox
6. Click **Save**

### Activate via Rails Console

```bash
bin/rails console
```

```ruby
fa_period = FreeAgencyPeriod.find_by(season: Season.current)
fa_period.update!(is_active: true)
```

**⚠️ Important:** Teams cannot place bids until the free agency period is active!

---

## Troubleshooting

### "No stats found for target year"

**Cause:** Stats haven't been imported for the target year

**Fix:**
1. Verify next season has `target_stat_year` configured
2. Run stats import: `bin/rails stats:import`
3. Verify import succeeded
4. Try again

**Check stats:**
```bash
bin/rails console
PlayerStat.where(year: 2025).count  # Replace 2025 with target year
```

---

### Players not becoming free agents

**Possible causes:**
1. Player has active contract (check RailsAdmin)
2. Player has no stats for target year
3. Player's `bbrefid` is missing or incorrect

**Fix:**
```bash
# Recalculate all free agent statuses
bin/rails free_agents:recalculate

# Check specific player in console
bin/rails console
player = Player.find_by(name: "Mike Trout")
player.contract              # Should be nil for FA
player.bbrefid              # Should be present
player.is_free_agent        # Current status
```

---

### Stats not showing on player pages

**Possible causes:**
1. Sidekiq not running (background job processor)
2. Redis not accessible
3. Stats expired from cache

**Fix:**

Check Sidekiq status:
```bash
# In QA
docker logs players-sidekiq-qa --tail 50

# In Production
docker logs players-scheduler --tail 50
```

Check Redis:
```bash
# In QA
docker exec players-redis-qa redis-cli ping

# In Production
docker exec players-redis redis-cli ping
```

Clear cache and retry:
```bash
bin/rails cache:clear
```

---

### Free agency period not showing

**Cause:** Period is inactive

**Fix:** See [Free Agency Activation](#free-agency-activation) section above

---

### Need to undo season switch

**Solution:** Restore from database backup

**Prevention:** Always run `season:preview` first and maintain regular backups!

---

### Players showing incorrect positions

**Cause:** Positions are auto-updated during stats import based on playing time

**Fix (Manual Override):**
1. Go to RailsAdmin → Players
2. Find the player
3. Click **Edit**
4. Update **Eligible Positions** field
5. Click **Save**

**Note:** Positions will be overwritten on next stats import unless you modify the import logic

---

## Quick Reference

### Common Commands

```bash
# Season management
bin/rails season:status              # View current season info
bin/rails season:preview             # Preview season switch impact
bin/rails season:switch              # Switch to next season

# Free agent management
bin/rails free_agents:recalculate    # Recalculate all FA statuses
bin/rails free_agents:stats          # Show FA statistics

# Stats management
bin/rails stats:import               # Import stats from Baseball Reference
bin/rails cache:clear                # Clear Redis cache

# Season promotion (optional)
bin/rails season:promote_free_agents # Preview/promote expiring contracts to FA
```

---

### Annual Checklist

**Start of Season (January):**
- [ ] Next season exists in database
- [ ] Next season has `target_stat_year` configured
- [ ] Stats imported for target year
- [ ] Preview season switch
- [ ] Execute season switch
- [ ] Recalculate free agent statuses
- [ ] Verify season status
- [ ] Activate free agency period
- [ ] Notify team owners

**Mid-Season (As Needed):**
- [ ] Import new players via Summer Draft
- [ ] Recalculate free agents after contract changes
- [ ] Monitor stats cache performance

**End of Season (October/November):**
- [ ] Create next season record
- [ ] Set next season's `target_stat_year`
- [ ] Link current season to next via `next_season_id`
- [ ] Prepare for stats import after MLB season

---

### RailsAdmin Access

**URL:** `/admin`

**Authentication:** Must be signed in as user with `is_admin: true`

**Common Tasks:**
- Manage players (edit positions, toggle FA status)
- View/edit contracts
- Activate free agency periods
- Import summer draft picks
- Reset user passwords
- Deactivate contracts

---

### Database Access (Advanced)

**Rails Console:**
```bash
bin/rails console
```

**Common Queries:**
```ruby
# Current season
Season.current

# Free agents count
Player.where(is_free_agent: true).count

# Active contracts
Contract.where(active: true).count

# Expiring contracts
current_season = Season.current
Contract.where(active: true, last_season_id: current_season.id)

# Check player eligibility
player = Player.find_by(name: "Mike Trout")
Player.has_stats_in_pybaseball?(player.bbrefid, 2025, player.positions)
```

---

## Support

For technical issues or questions:
- Check GitHub repository issues
- Review application logs
- Contact system administrator

---

**Last Updated:** 2026-04-20
**BMPL Season:** 2025-2026
