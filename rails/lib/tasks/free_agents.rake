namespace :free_agents do
  desc 'Recalculate is_free_agent status for all players based on contracts and stats'
  task recalculate: :environment do
    puts 'RECALCULATING FREE AGENT STATUS FOR ALL PLAYERS'
    puts '=' * 80
    puts ''

    current_season = Season.current
    unless current_season&.target_stat_year
      puts "ERROR: Current season has no target_stat_year configured"
      exit 1
    end

    puts "Target stat year: #{current_season.target_stat_year}"
    puts "Stats will be fetched on-demand from pybaseball via StatsFetcher"
    puts ""

    before_count = Player.where(is_free_agent: true).count
    puts "Free agents before: #{before_count}"
    puts ""

    # Update all players based on contract presence AND stats
    updated = 0

    Player.find_each do |player|
      old_status = player.is_free_agent

      # New status: free agent if no active contract AND has stats
      if player.contract.present?
        new_status = false
      elsif Player.has_stats_in_pybaseball?(player.bbrefid, current_season.target_stat_year, player.positions)
        new_status = true
      else
        new_status = false
      end

      if old_status != new_status
        # Use update_column to skip validation (admin override)
        player.update_column(:is_free_agent, new_status)
        updated += 1

        reason = if player.contract.present?
          'removed from FA (has contract)'
        elsif new_status
          'set to FA (no contract, has stats)'
        else
          'removed from FA (no stats)'
        end

        puts "  #{player.name}: #{reason}"
      end
    end

    after_count = Player.where(is_free_agent: true).count

    puts ''
    puts '=' * 80
    puts "Free agents after: #{after_count}"
    puts "Changed: #{updated}"
  end

  desc "Show current free agent statistics"
  task stats: :environment do
    total_players = Player.count
    free_agents = Player.where(is_free_agent: true).count
    contracted = Player.joins(:contract).distinct.count
    ineligible = total_players - free_agents - contracted

    puts "Free Agent Statistics:"
    puts "  Total Players: #{total_players}"
    puts "  Free Agents: #{free_agents}"
    puts "  Under Contract: #{contracted}"
    puts "  Ineligible: #{ineligible}"
  end
end
