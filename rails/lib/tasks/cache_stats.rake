namespace :stats do
  desc "Pre-warm stats cache for all free agents"
  task warm_cache: :environment do
    puts "\n📊 Warming stats cache for free agents..."
    puts "=" * 80

    current_season = Season.current
    unless current_season
      puts "❌ No active season found"
      exit 1
    end

    target_year = current_season.target_stat_year
    unless target_year
      puts "❌ No target stat year set for #{current_season.name}"
      exit 1
    end

    puts "Season: #{current_season.name}"
    puts "Target stat year: #{target_year}"
    puts ""

    free_agents = Player.where(is_free_agent: true).where.not(bbrefid: [nil, ''])
    total = free_agents.count

    puts "Free agents to cache: #{total}"
    puts ""

    cached = 0
    fetched = 0
    errors = 0

    free_agents.find_each.with_index do |player, index|
      begin
        cache_key = "player_stats:#{player.bbrefid}:#{target_year}"

        if Rails.cache.exist?(cache_key)
          cached += 1
          status = "✓ cached"
        else
          # Fetch and cache stats (synchronously for rake task)
          StatsFetcher.fetch_for_player(player, target_year, async: false)
          fetched += 1
          status = "→ fetched"
        end

        print "\r[#{index + 1}/#{total}] #{status} #{player.name.ljust(30)}"

      rescue => e
        errors += 1
        puts "\n❌ Error for #{player.name}: #{e.message}"
      end
    end

    puts "\n"
    puts "=" * 80
    puts "✅ Complete!"
    puts "   Already cached: #{cached}"
    puts "   Newly fetched: #{fetched}"
    puts "   Errors: #{errors}"
    puts ""
  end

  desc "Clear stats cache"
  task clear_cache: :environment do
    puts "\n🗑️  Clearing stats cache..."

    # This will clear all cache keys matching the pattern
    # Note: This assumes Redis cache store
    if Rails.cache.is_a?(ActiveSupport::Cache::RedisCacheStore)
      redis = Rails.cache.redis
      keys = redis.keys("player_stats:*")
      if keys.any?
        redis.del(*keys)
        puts "✓ Cleared #{keys.count} cached stats entries"
      else
        puts "✓ No stats cache to clear"
      end
    else
      puts "⚠️  Not using Redis cache store - cannot clear pattern"
      puts "   Try: Rails.cache.clear (clears ALL cache)"
    end

    puts ""
  end
end
