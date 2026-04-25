namespace :cache do
  desc "Warm up the stats cache from database records"
  task warmup: :environment do
    puts "=== Cache Warmup Starting ==="

    season = Season.current
    unless season
      puts "No current season found, skipping cache warmup"
      exit
    end

    puts "Current season: #{season.name} (target year: #{season.target_stat_year})"

    # Get all players with stats in current season
    players_with_stats = Player
      .joins(:player_stats)
      .where(player_stats: { season_id: season.id })
      .distinct
      .order(is_free_agent: :desc) # Prioritize free agents

    total = players_with_stats.count
    puts "Found #{total} players with stats to cache"

    cached_count = 0
    skipped_count = 0

    players_with_stats.find_each.with_index do |player, index|
      next if player.bbrefid.blank?

      cache_key = "player_stats:#{player.bbrefid}:#{season.target_stat_year}"

      # Skip if already cached
      if Rails.cache.exist?(cache_key)
        skipped_count += 1
        next
      end

      # Get stats from database
      player_stat = PlayerStat.find_by(player: player, season: season)
      if player_stat&.stats&.any?
        Rails.cache.write(cache_key, player_stat.stats, expires_in: 24.hours)
        cached_count += 1

        # Log progress every 50 players
        if (index + 1) % 50 == 0
          puts "Progress: #{index + 1}/#{total} players processed (#{cached_count} cached, #{skipped_count} skipped)"
        end
      end
    end

    puts "=== Cache Warmup Complete ==="
    puts "Cached: #{cached_count} players"
    puts "Skipped (already cached): #{skipped_count} players"
    puts "Total processed: #{cached_count + skipped_count}"
  end

  desc "Quick warmup - only free agents (faster startup)"
  task warmup_quick: :environment do
    puts "=== Quick Cache Warmup (Free Agents Only) ==="

    season = Season.current
    unless season
      puts "No current season found, skipping cache warmup"
      exit
    end

    # Only warm cache for free agents
    free_agents = Player
      .where(is_free_agent: true)
      .joins(:player_stats)
      .where(player_stats: { season_id: season.id })
      .distinct
      .limit(100) # Top 100 free agents

    total = free_agents.count
    puts "Warming cache for #{total} free agents"

    cached_count = 0

    free_agents.each_with_index do |player, index|
      next if player.bbrefid.blank?

      cache_key = "player_stats:#{player.bbrefid}:#{season.target_stat_year}"
      next if Rails.cache.exist?(cache_key)

      player_stat = PlayerStat.find_by(player: player, season: season)
      if player_stat&.stats&.any?
        Rails.cache.write(cache_key, player_stat.stats, expires_in: 24.hours)
        cached_count += 1
      end
    end

    puts "=== Quick Warmup Complete ==="
    puts "Cached #{cached_count}/#{total} free agents"
  end
end
