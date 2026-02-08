# Stats Import System

This system imports player statistics from FanGraphs using pybaseball and stores them in the `player_stats` table.

## Architecture

- **Source**: FanGraphs (via pybaseball Python library)
- **Stats Included**: All batting/pitching stats **including WAR**
- **Storage**: PostgreSQL `player_stats` table (player_id, season_id, stats JSONB)
- **Dependencies**: Python 3 + pybaseball (installed in Docker image)

## Quick Start

### Import stats for current season's free agents

```bash
docker compose exec players rake stats:import
```

### Import stats for ALL players (not just free agents)

```bash
docker compose exec players bash -c "cd /app && ALL_PLAYERS=1 bundle exec rake stats:import"
```

### Import specific players

```bash
docker compose exec players rake stats:import BBREFIDS=judgeaa01,ohtansh01,troutmi01
```

### Import for a different season

```bash
docker compose exec players bash -c "cd /app && SEASON_ID=3 ALL_PLAYERS=1 bundle exec rake stats:import"
```

### Import all historical seasons

```bash
# Import stats for all players across all past seasons
for season_id in 1 2 4 3 5 6; do
  docker compose exec players bash -c "cd /app && SEASON_ID=$season_id ALL_PLAYERS=1 bundle exec rake stats:import"
done
```

## How It Works

1. **Fetch from FanGraphs**: Python script calls pybaseball to get:
   - `batting_stats(2025, 2025, qual=0)` - All batters (1 request)
   - `pitching_stats(2025, 2025, qual=0)` - All pitchers (1 request)
   - `fielding_stats(2025, 2025, qual=0)` - Fielding positions (1 request)
   - `chadwick_register()` - FanGraphs ID → BBRef ID mapping

2. **Match by BBRef ID**: Uses Chadwick Register to map FanGraphs player IDs to BBRef IDs for accurate matching (no accent/name issues)

3. **Update Player Records**: Updates player names and positions from FanGraphs canonical data
   - Names: Updates to FanGraphs canonical spelling (e.g., "Diaz" → "Díaz")
   - Positions:
     - Position players: Uses `fielding_stats()` position data (e.g., "SS", "2B/SS", "CF", "LF/RF")
     - Pitchers only: Classifies as SP if GS > 5, RP if GS ≤ 5
     - Two-way players: Combines positions if **PA ≥ 100 AND IP > 20** (e.g., "DH/SP", "RF/SP")
       - Uses actual stats to determine two-way status (not current position)
       - This correctly identifies players like Ohtani who have significant playing time at both
       - Position players with incidental pitching (<20 IP) are not classified as pitchers
       - Pitchers who occasionally bat (<100 PA) are not classified as two-way

4. **Store in Database**: Save to `player_stats` table with:
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
    stats(year: 2025)
  }
}
```

Returns: `{ "PA": "679", "HR": "53", "BA": "0.331", "WAR": "10.1", ... }`

### Rails Console

```ruby
# Get a player's stats
player = Player.find_by(name: "Aaron Judge")
stats = PlayerStat.find_by(player: player, season: Season.current)
stats["WAR"]  # => "10.1"

# WAR per dollar query (for players with contracts)
PlayerStat.joins(player: :contract)
  .select("players.name,
           stats->>'WAR' as war,
           contracts.amount,
           (stats->>'WAR')::float / contracts.amount as war_per_dollar")
  .order("war_per_dollar DESC")
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

- **First run**: ~30 seconds (downloads from FanGraphs)
- **Subsequent runs**: ~10 seconds (uses pybaseball cache)
- **Total requests**: 2 (batting + pitching leaderboards)
- **No rate limiting** - Fetches leaderboards, not individual pages

## Workflow

### When Free Agency Starts

```bash
# 1. Import stats for all free agents
docker compose exec players rake stats:import

# 2. Verify import
docker compose exec players rails runner "
  puts 'Total stats: ' + PlayerStat.count.to_s
  puts 'With WAR: ' + PlayerStat.where(\"stats->>'WAR' IS NOT NULL\").count.to_s
"
```

### When New Season Starts

1. Update `Season.current.target_stat_year` to new year
2. Run import again - new stats for new season
3. Historical stats preserved (tied to previous season)

## Why This Approach?

✅ **Single source** - FanGraphs for everything (including WAR)
✅ **No CSV management** - No git-tracking large files
✅ **No rate limiting** - Bulk leaderboard fetch (2 requests total)
✅ **Simple dependencies** - Just Python + pybaseball
✅ **docker compose up works** - All deps installed automatically
✅ **Perfect for "WAR per dollar"** - WAR included in every import
✅ **BBRef ID matching** - No name/accent issues, accurate player matching
✅ **Auto-updates names** - Keeps database in sync with FanGraphs canonical names
