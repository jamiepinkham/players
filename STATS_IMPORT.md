# Stats System

This system fetches player statistics from MLB Stats API using pybaseball with Redis caching and database persistence.

## Architecture

- **Source**: MLB Stats API (via pybaseball Python library)
- **Stats Included**: All batting/pitching stats **excluding WAR** (Baseball Reference broken)
- **Storage**:
  - **Primary**: Redis cache (24-hour expiry) for fast access
  - **Secondary**: PostgreSQL `player_stats` table for cache warmup
- **Dependencies**: Python 3 + pybaseball, Redis, PostgreSQL

## Quick Start

### Populate Stats Database (First Time)

```bash
# Production/QA
docker exec players-web rails stats:populate

# Local development
docker compose exec players rails stats:populate
```

This creates `PlayerStat` database records for all players with 2025 stats.

**Stats**: ~2,800 players, ~1,000 new records, 0 errors
**Time**: ~30 minutes (fetches from MLB API, one player at a time)

### Warm Redis Cache from Database (After Restart)

```bash
# Quick warmup - top 100 free agents (5-10 seconds)
docker exec players-web rails cache:warmup_quick

# Full warmup - all players with stats (1-2 minutes)
docker exec players-web rails cache:warmup
```

This loads stats from `player_stats` table into Redis (fast, no API calls).

### Clean Up Ineligible Players

```bash
# List players without current season stats
docker exec players-web rails players:list_ineligible

# Remove them from database
docker exec players-web rails players:remove_ineligible
```

Removes players who can't be signed (no stats for current season).

## How It Works

### Stats Fetching Flow (Three-Tier System)

#### 1. GraphQL Request (Frontend)
```graphql
player(id: "123") {
  stats(year: 2025) { title value }
}
```

#### 2. StatsFetcher Service (three-tier fallback)
```ruby
StatsFetcher.fetch_for_player(player, year, async: true)

# Tier 1: Check Redis cache (1-10ms)
return cached_stats if cached

# Tier 2: Check PlayerStat database (10-50ms)
player_stat = PlayerStat.find_by(player: player, season: season)
if player_stat.present?
  Rails.cache.write(cache_key, player_stat.stats)
  return player_stat.stats  # Fast! No spinner!
end

# Tier 3: Fall back to slow MLB API (2-3 seconds)
FetchPlayerStatsJob.perform_later(bbrefid, year)
return {}  # Spinner shows, frontend retries
```

#### 3. Background Job (only if database miss)
```ruby
FetchPlayerStatsJob.perform_later(bbrefid, year)
# Calls Python script to fetch from MLB API
# Writes to Redis cache (24-hour expiry)
# Optionally creates PlayerStat record
```

#### 4. Frontend Retry Logic
- Gets empty `{}` only if both cache AND database miss
- Retries 3 times with 2-second delays
- Eventually gets stats from cache after job completes

**Result**: Most requests hit database (fast, no spinners) instead of slow API!

### Database Persistence (PlayerStat model)

Created by `rails stats:populate`:

```ruby
PlayerStat.create!(
  player: player,
  season: season,
  stats: {
    "PA" => "679",
    "HR" => "53",
    "BA" => ".291",
    # ... all stats
  }
)
```

**Used for:**
- Cache warmup (fast, no API calls)
- Persistent storage across cache clears
- Historical records

**Not used for:**
- Real-time queries (cache-first)
- Automatic updates (manual populate)

## Stats Included

### Batting Stats
PA, G, AB, H, 1B, 2B, 3B, HR, R, RBI, SB, BB, SO, BA, OBP, SLG, OPS

### Pitching Stats
IP, G, GS, W, L, SV, H, R, ER, HR, BB, SO, ERA, WHIP

### Excluded
- **WAR** - Disabled (Baseball Reference parsing broken)

## Rake Tasks

### `rails stats:populate`
**Purpose**: Fetch stats from MLB API and create PlayerStat records

**Options**:
```bash
# All players with bbrefid
rails stats:populate

# Specific players only
rails stats:populate BBREFIDS=judgeaa01,ohtansh01

# Specific year
rails stats:populate YEAR=2024
```

**What it does**:
1. Finds all players with `bbrefid` set
2. Calls `PlayerStat.fetch_or_create_for(player, season)`
3. Fetches stats from MLB API (synchronous)
4. Creates database record
5. Writes to Redis cache

**Performance**:
- ~2-3 seconds per player
- ~30 minutes for 600 players
- Uses MLB Stats API (rate limited)

### `rails cache:warmup`
**Purpose**: Load stats from database into Redis cache

**Options**:
```bash
# All players with stats (1-2 minutes)
rails cache:warmup

# Top 100 free agents only (5-10 seconds)
rails cache:warmup_quick
```

**What it does**:
1. Reads `PlayerStat` records from database
2. Writes to Redis cache (24-hour expiry)
3. No API calls (fast!)

**When to use**:
- After container restart (cache cleared)
- After Redis restart
- When free agents page shows spinners

### `rails players:remove_ineligible`
**Purpose**: Clean up players without current season stats

**What it does**:
1. Finds players with no stats for `Season.current.target_stat_year`
2. Deletes them from database
3. Typically removes ~47% of database (1,300+ players)

**Why**: Players without current season stats can't be signed and clutter the database.

## Dependencies

### Python Requirements (`requirements.txt`)
```
pybaseball==2.2.7
```

### Docker Setup
Automatically installed in Docker image:
- Python 3.11+
- pip3
- pybaseball

## Querying Stats

### GraphQL (Frontend)
```graphql
query {
  player(id: "123") {
    name
    stats(year: 2025) {
      title
      value
    }
  }
}
```

Returns: `[{ title: "PA", value: "679" }, { title: "HR", value: "53" }, ...]`

### Rails Console
```ruby
# Fetch stats (async by default)
player = Player.find_by(name: "Aaron Judge")
stats = StatsFetcher.fetch_for_player(player, 2025)
# => {} (returns immediately, job queued)

# Fetch synchronously (waits for result)
stats = StatsFetcher.fetch_for_player(player, 2025, async: false)
# => { "PA" => "679", "HR" => "53", ... }

# Get from database
player_stat = PlayerStat.find_by(player: player, season: Season.current)
player_stat.stats["HR"]  # => "53"

# Invalidate cache
cache_key = "player_stats:#{player.bbrefid}:2025"
Rails.cache.delete(cache_key)
```

## Troubleshooting

### Free Agents Page Shows Spinners

**Cause**: Redis cache empty, background jobs haven't completed yet

**Fix**:
```bash
# Quick warmup from database
docker exec players-web rails cache:warmup_quick
```

### Stats Not Showing for Player

**Check**:
1. Does player have `bbrefid`? `player.bbrefid.present?`
2. Does PlayerStat record exist? `PlayerStat.find_by(player: player, season: Season.current)`
3. Is it cached? `Rails.cache.exist?("player_stats:#{bbrefid}:2025")`

**Fix**:
```bash
# Fetch for specific player
docker exec players-web rails runner '
player = Player.find_by(name: "Aaron Judge")
PlayerStat.fetch_or_create_for(player, Season.current)
'
```

### pybaseball Errors

**Symptoms**: `ModuleNotFoundError: No module named 'pybaseball'`

**Fix**:
```bash
# Rebuild Docker image
docker compose build players
docker compose up -d
```

### Cache Cleared After Restart

**Expected behavior** - Redis cache is in-memory by default

**Solution**: Run cache warmup automatically on startup
```yaml
# docker-compose.yml
command: sh -c "bin/warmup-cache && bin/rails server -b 0.0.0.0"
```

See `rails/CACHE_WARMUP.md` for details.

## Performance

### Query Performance (three-tier system)
- **Tier 1 - Cache hit**: ~1-10ms (Redis) ✅ **Most common**
- **Tier 2 - Database hit**: ~10-50ms (PostgreSQL) ✅ **After cache expires**
- **Tier 3 - API fetch**: ~2-3 seconds (MLB API + job) ⚠️ **Rare (new players only)**

### Cache Warmup (from database)
- **Quick warmup**: 5-10 seconds (100 free agents)
- **Full warmup**: 1-2 minutes (all players)
- **No API calls** - reads from PostgreSQL

### Stats Population (from MLB API)
- **Per player**: 2-3 seconds
- **600 players**: ~30 minutes
- **Rate limited** - MLB Stats API

**Key improvement**: After 24-hour cache expiry, stats come from database (50ms) instead of slow API (2-3 sec). No spinners! 🎉

## Workflow

### Season Start
1. Update `Season.current.target_stat_year` to new year (e.g., 2026)
2. Run `rails stats:populate` to fetch new season's stats
3. Run `rails players:remove_ineligible` to clean up old players
4. Cache automatically expires and refreshes

### Free Agency Start
1. Ensure stats populated: `rails stats:populate`
2. Warm cache: `rails cache:warmup`
3. Free agents page loads fast (no spinners)

### Container Restart
1. Cache cleared (in-memory Redis)
2. **Automatic**: `bin/warmup-cache` runs on startup (if configured)
3. **Manual**: `rails cache:warmup_quick`

### Player Addition
New players get stats automatically:
1. Player created with `bbrefid`
2. Frontend requests stats
3. Background job fetches from MLB API
4. Stats cached and returned on retry

## Why This Approach?

✅ **Three-tier fallback** - Cache (1ms) → Database (50ms) → API (2s)
✅ **No spinners after expiry** - Database fallback prevents slow API calls
✅ **Cache-first** - Fast access via Redis when available
✅ **Database persistence** - Survives cache clears, enables warmup
✅ **Async fetching** - Non-blocking, frontend retries automatically
✅ **Single source** - MLB Stats API for all data
✅ **Accurate matching** - BBRef ID matching (no name/accent issues)
✅ **Always fresh** - 24-hour cache expiry
✅ **Clean database** - Remove ineligible players
✅ **Fast startup** - Warmup from database in seconds

**Key benefit**: Free agents page stays fast even after 24-hour cache expiry!

## File Locations

- **Stats Fetcher**: `rails/app/services/stats_fetcher.rb`
- **Background Job**: `rails/app/jobs/fetch_player_stats_job.rb`
- **PlayerStat Model**: `rails/app/models/player_stat.rb`
- **Python Script**: `rails/lib/scripts/fetch_fangraphs_stats.py`
- **Rake Tasks**: `rails/lib/tasks/populate_player_stats.rake`, `rails/lib/tasks/cache_warmup.rake`
- **GraphQL Resolver**: `rails/app/graphql/types/player_type.rb`

## Additional Documentation

- **Cache Warmup**: See `rails/CACHE_WARMUP.md`
- **Season Switching**: See `rails/SEASON_SWITCH.md`
- **Deployment**: See `~/dev/players-deployment/docs/DEPLOYMENT.md`
