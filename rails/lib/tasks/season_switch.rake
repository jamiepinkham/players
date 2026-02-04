namespace :season do
  desc 'Preview which players will become free agents when season switches'
  task preview_free_agents: :environment do
    current_season = Season.current
    next_season = Season.find_by(id: current_season.id + 1)

    unless next_season
      puts "ERROR: Next season not found"
      exit 1
    end

    unless next_season.target_stat_year.present?
      puts "ERROR: Next season has no target_stat_year configured"
      exit 1
    end

    puts "PREVIEW: Free Agents for #{next_season.name}"
    puts "Target stat year: #{next_season.target_stat_year}"
    puts "=" * 80
    puts ""

    # Check if we have ANY stats for the target year
    stats_count = PlayerStat.joins(:season).where('seasons.target_stat_year = ?', next_season.target_stat_year).count
    if stats_count == 0
      puts "❌ ERROR: No stats found for target year #{next_season.target_stat_year}"
      puts "   Please run stats import before previewing free agents:"
      puts "   bin/rails stats:import"
      exit 1
    end

    puts "✓ Found #{stats_count} player stat records for #{next_season.target_stat_year}"
    puts ""

    # Find contracts expiring this season
    expiring_contracts = Contract
      .where(active: true)
      .where(last_season_id: current_season.id)
      .includes(:player, :team)

    eligible = []
    ineligible = []

    expiring_contracts.each do |contract|
      player = contract.player

      # Check if player has stats for next season's target year
      has_stats = Player.has_stats_in_pybaseball?(player.bbrefid, next_season.target_stat_year, player.position)

      if has_stats
        eligible << { player: player, team: contract.team }
      else
        ineligible << { player: player, team: contract.team }
      end
    end

    puts "ELIGIBLE (will become FA automatically):"
    if eligible.empty?
      puts "  (none)"
    else
      eligible.each do |data|
        puts "  ✓ #{data[:player].name} (#{data[:player].position}) from #{data[:team].name}"
      end
    end

    puts ""
    puts "INELIGIBLE (no stats for #{next_season.target_stat_year}):"
    if ineligible.empty?
      puts "  (none)"
    else
      ineligible.each do |data|
        puts "  ✗ #{data[:player].name} (#{data[:player].position}) from #{data[:team].name}"
      end
    end

    puts ""
    puts "=" * 80
    puts "Summary:"
    puts "  #{eligible.count} players will become free agents"
    puts "  #{ineligible.count} players will NOT become free agents (no stats)"
    puts ""
    puts "Run 'rake season:promote_free_agents' to execute this change"
  end

  desc 'Promote eligible players to free agents at season switch'
  task promote_free_agents: :environment do
    current_season = Season.current
    next_season = Season.find_by(id: current_season.id + 1)

    unless next_season
      puts "ERROR: Next season not found"
      exit 1
    end

    unless next_season.target_stat_year.present?
      puts "ERROR: Next season has no target_stat_year configured"
      exit 1
    end

    # Check if we have ANY stats for the target year
    stats_count = PlayerStat.joins(:season).where('seasons.target_stat_year = ?', next_season.target_stat_year).count
    if stats_count == 0
      puts "❌ ERROR: No stats found for target year #{next_season.target_stat_year}"
      puts "   Please run stats import before promoting free agents:"
      puts "   bin/rails stats:import"
      exit 1
    end

    puts "PROMOTING FREE AGENTS for #{next_season.name}"
    puts "=" * 80
    puts ""

    # Find contracts expiring this season
    expiring_contracts = Contract
      .where(active: true)
      .where(last_season_id: current_season.id)
      .includes(:player)

    promoted = 0

    expiring_contracts.each do |contract|
      player = contract.player

      # Check if player has stats for next season's target year
      if Player.has_stats_in_pybaseball?(player.bbrefid, next_season.target_stat_year, player.position)
        player.update_column(:is_free_agent, true)
        promoted += 1
        puts "  ✓ #{player.name} promoted to free agent"
      else
        puts "  ✗ #{player.name} NOT promoted (no stats for #{next_season.target_stat_year})"
      end
    end

    puts ""
    puts "=" * 80
    puts "Promoted #{promoted} players to free agent status"
  end
end
