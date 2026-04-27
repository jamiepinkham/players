namespace :cache do
  desc "Warm stats cache for all free agents"
  task warmup_stats: :environment do
    current_season = Season.current

    unless current_season&.target_stat_year
      puts "ERROR: Current season has no target_stat_year configured"
      exit 1
    end

    year = current_season.target_stat_year
    free_agents = Player.where(is_free_agent: true).where.not(bbrefid: nil)

    puts "Warming stats cache for #{free_agents.count} free agents (year: #{year})"
    puts "=" * 80

    success_count = 0
    error_count = 0

    free_agents.find_each do |player|
      begin
        print "Fetching stats for #{player.name.ljust(30)} (#{player.bbrefid})... "
        stats = StatsClient.fetch(player.bbrefid, year)

        if stats.present?
          puts "✓ (#{stats.keys.count} stats)"
          success_count += 1
        else
          puts "⚠ (no stats returned - will fetch async)"
          success_count += 1
        end
      rescue => e
        puts "✗ (error: #{e.message})"
        error_count += 1
      end

      # Small delay to avoid overwhelming the API
      sleep 0.1
    end

    puts "=" * 80
    puts "Complete: #{success_count} successful, #{error_count} errors"
  end

  desc "Warm stats cache for all free agents (quick - fire and forget)"
  task warmup_quick: :environment do
    current_season = Season.current

    unless current_season&.target_stat_year
      puts "ERROR: Current season has no target_stat_year configured"
      exit 1
    end

    year = current_season.target_stat_year
    free_agents = Player.where(is_free_agent: true).where.not(bbrefid: nil)

    puts "Triggering async stats fetch for #{free_agents.count} free agents (year: #{year})"

    # Just trigger the fetches without waiting for results
    free_agents.find_each do |player|
      StatsClient.fetch(player.bbrefid, year)
    end

    puts "Stats fetch triggered. Check stats-api logs for progress."
  end
end
