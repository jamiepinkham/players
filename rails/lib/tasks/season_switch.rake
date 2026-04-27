namespace :season do
  desc 'Preview and promote eligible players to free agents at season switch'
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

    # Note: Stats are now managed by the stats microservice
    # The stats:import task should be run on the stats service before promotion
    # No local database check needed

    puts "\n🔍 FREE AGENT PROMOTION PREVIEW"
    puts "=" * 80
    puts ""
    puts "📅 Promoting for: #{next_season.name}"
    puts "📊 Target stat year: #{next_season.target_stat_year}"
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
      has_stats = Player.has_stats_in_pybaseball?(player.bbrefid, next_season.target_stat_year, player.positions)

      if has_stats
        eligible << { player: player, team: contract.team, contract: contract }
      else
        ineligible << { player: player, team: contract.team, contract: contract }
      end
    end

    puts "ELIGIBLE (will become FA):"
    if eligible.empty?
      puts "  (none)"
    else
      eligible.each do |data|
        puts "  ✓ #{data[:player].name} (#{data[:player].positions&.join(', ')}) from #{data[:team].name}"
      end
    end

    puts ""
    puts "INELIGIBLE (no stats for #{next_season.target_stat_year}):"
    if ineligible.empty?
      puts "  (none)"
    else
      ineligible.each do |data|
        puts "  ✗ #{data[:player].name} (#{data[:player].positions&.join(', ')}) from #{data[:team].name}"
      end
    end

    puts ""
    puts "=" * 80
    puts "Summary:"
    puts "  #{eligible.count} players will become free agents"
    puts "  #{ineligible.count} players will NOT become free agents (no stats)"
    puts ""

    # Confirmation
    print "⚠️  This will set is_free_agent = true for #{eligible.count} players.\n"
    print "   Continue? (yes/no): "
    confirmation = STDIN.gets.chomp.downcase

    unless confirmation == 'yes'
      puts "❌ Free agent promotion cancelled"
      exit 0
    end

    puts "\n🚀 Promoting free agents..."
    puts ""

    promoted = 0

    eligible.each do |data|
      player = data[:player]
      player.update_column(:is_free_agent, true)
      promoted += 1
      puts "  ✓ #{player.name} promoted to free agent"
    end

    ineligible.each do |data|
      player = data[:player]
      puts "  ✗ #{player.name} NOT promoted (no stats for #{next_season.target_stat_year})"
    end

    puts ""
    puts "=" * 80
    puts "✅ Promoted #{promoted} players to free agent status"
    puts ""
  end
end
