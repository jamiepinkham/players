# Stats System

This system fetches player statistics from FanGraphs using pybaseball **on-demand** with Redis caching.

## Architecture

- **Source**: FanGraphs (via pybaseball Python library)
- **Stats Included**: All batting/pitching stats **including WAR**
- **Storage**: Redis cache (24-hour expiry) - stats fetched on-demand from GraphQL
- **Dependencies**: Python 3 + pybaseball (installed in Docker image), Redis

## Quick Start

### Warm Redis cache for current season's free agents (optional)

Stats are fetched on-demand, but you can pre-warm the cache for faster first page load:

```bash
docker compose exec players rake stats:import
```

### Warm cache for ALL players (not just free agents)

```bash
docker compose exec players bash -c "cd /app && ALL_PLAYERS=1 bundle exec rake stats:import"
```

### Warm cache for specific players

```bash
docker compose exec players rake stats:import BBREFIDS=judgeaa01,ohtansh01,troutmi01
```

**Note**: These commands are optional. Stats will be fetched automatically when requested via GraphQL.

## How It Works

### On-Demand Fetching (Automatic)

When stats are requested via GraphQL:

1. **Check Redis cache**: `StatsFetcher` checks if stats for that player/year are cached
2. **If cached**: Return immediately (~1-10ms)
3. **If not cached**:
   - Call Python script with player's bbrefid: `fetch_fangraphs_stats.py 2025 judgeaa01`
   - Parse JSON response and combine batting/pitching stats
   - Store in Redis cache (24-hour expiry)
   - Return stats to GraphQL resolver

### Cache Warming (Optional via rake stats:import)

The rake task pre-populates Redis cache for faster first page load:

1. **Fetch from FanGraphs**: Python script calls pybaseball to get:
   - `batting_stats(2025, 2025, qual=0)` - All batters (1 request)
   - `pitching_stats(2025, 2025, qual=0)` - All pitchers (1 request)
   - `fielding_stats(2025, 2025, qual=0)` - Fielding positions (1 request)
   - `chadwick_register()` - FanGraphs ID → BBRef ID mapping

2. **Match by BBRef ID**: Uses Chadwick Register to map FanGraphs player IDs to BBRef IDs for accurate matching (no accent/name issues)

3. **Update Player Records**: Updates player names and positions from FanGraphs canonical data
   - Names: Updates to FanGraphs canonical spelling (e.g., "Diaz" → "Díaz")
   - Positions: Stored as arrays (e.g., ["SS", "2B"], ["SP"], ["DH", "SP"])
     - Position players: Uses `fielding_stats()` (converted to "OF" for LF/CF/RF)
     - Pitchers only: ["SP"] if GS > 5, ["RP"] if GS ≤ 5
     - Two-way players: Combines positions if **PA ≥ 100 AND IP > 20** (e.g., ["DH", "SP"])

4. **Warm Redis Cache**: Write stats to Redis with 24-hour expiry:
   - Batting: PA, G, AB, H, 1B, 2B, 3B, HR, R, RBI, SB, BB, SO, BA, OBP, SLG, OPS, WAR
   - Pitching: IP, G, GS, W, L, SV, H, R, ER, HR, BB, SO, ERA, WHIP, WAR
   - Two-way players: Combined (batting + pitching WAR summed)

## Dependencies

### Python Requirements

Defined in `requirements.txt`:
```
pybaseball==2.2.7
```

Installed automatically during `docker compose build`.

### Docker Setup

The Dockerfile installs:
- Python 3
- pip3
- pybaseball (from requirements.txt)

**No manual setup needed** - `docker compose up` just works!

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
# Get a player's stats (fetches from Redis cache or pybaseball)
player = Player.find_by(name: "Aaron Judge")
stats = StatsFetcher.fetch_for_player(player, 2025)
stats["WAR"]  # => "10.1"

# Invalidate cache to force fresh fetch
StatsFetcher.invalidate_cache("judgeaa01", 2025)
```

## Troubleshooting

### Players not matching

Players are matched by BBRef ID using the Chadwick Register, so name/accent issues are avoided. If a player doesn't match:
- Check that the player has a valid `bbrefid` in the database
- Verify the player appeared in FanGraphs stats for that year (they need games played)
- Check if the BBRef ID exists in the Chadwick Register mapping

### pybaseball errors

If you see "pybaseball not installed":
```bash
docker compose build players
docker compose up -d
```

### Cache issues

pybaseball caches data in `~/.pybaseball`. To force refresh, clear cache:
```bash
docker compose exec players python3 -c "from pybaseball import cache; cache.purge()"
```

## Performance

### On-Demand Fetching
- **Cache hit**: ~1-10ms (Redis)
- **Cache miss**: ~1-2 seconds (Python subprocess + pybaseball)
- **Cache expiry**: 24 hours

### Bulk Cache Warming (rake stats:import)
- **First run**: ~30 seconds (downloads from FanGraphs)
- **Subsequent runs**: ~10 seconds (uses pybaseball cache)
- **Total requests**: 3 (batting + pitching + fielding leaderboards)
- **No rate limiting** - Fetches leaderboards, not individual pages

## Workflow

### When Free Agency Starts

```bash
# 1. (Optional) Warm Redis cache for all free agents
docker compose exec players rake stats:import

# Stats will be fetched on-demand when players are viewed
# The rake task just pre-warms the cache for faster first page load
```

### When New Season Starts

1. Update `Season.current.target_stat_year` to new year
2. Stats for new year will be fetched on-demand
3. Old cached stats expire after 24 hours

## Why This Approach?

✅ **On-demand fetching** - Stats fetched only when needed, no stale data
✅ **Single source** - FanGraphs for everything (including WAR)
✅ **Redis caching** - Fast repeated access, automatic expiry
✅ **No database migrations** - No `player_stats` table to maintain
✅ **No CSV management** - No git-tracking large files
✅ **Simple dependencies** - Just Python + pybaseball + Redis
✅ **BBRef ID matching** - No name/accent issues, accurate player matching
✅ **Auto-updates names** - Keeps database in sync with FanGraphs canonical names
✅ **Always fresh** - Cache expires every 24 hours, refetches latest stats
