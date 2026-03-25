namespace :players do
  desc "List players with no stats in target year and no contract (ineligible)"
  task list_ineligible: :environment do
    puts "\n🔍 Finding ineligible players..."
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

    # Find players who:
    # 1. Have a bbrefid (were trackable at some point)
    # 2. Don't have an active contract
    # 3. Don't have stats for the target year OR have 0 IP/PA

    players_with_contracts = Contract.where(active: true)
      .where('first_season_id <= ?', current_season.id)
      .where('last_season_id >= ?', current_season.id)
      .pluck(:player_id)

    # Get all players with bbrefid who aren't under contract
    players = Player.where.not(bbrefid: [nil, ''])
      .where.not(id: players_with_contracts)

    puts "Checking #{players.count} players without contracts..."
    puts ""

    ineligible = []

    players.find_each do |player|
      player_stat = PlayerStat.find_by(player: player, season: current_season)

      if player_stat.nil? || player_stat.stats.empty?
        # No stats record at all
        ineligible << { player: player, reason: "No stats record" }
      else
        # Check if they have meaningful playing time
        stats = player_stat.stats

        # Determine if pitcher or position player
        is_pitcher = player.positions&.any? { |p| ['SP', 'RP'].include?(p) }

        if is_pitcher
          ip = stats['IP']&.to_f || 0
          if ip == 0
            ineligible << { player: player, reason: "0 IP" }
          end
        else
          pa = stats['PA']&.to_i || 0
          if pa == 0
            ineligible << { player: player, reason: "0 PA" }
          end
        end
      end
    end

    puts "=" * 80
    puts "Found #{ineligible.count} ineligible players:"
    puts ""

    ineligible.each do |entry|
      player = entry[:player]
      reason = entry[:reason]
      positions = player.positions&.join('/') || 'N/A'
      puts "  #{player.name.ljust(30)} #{positions.ljust(10)} - #{reason}"
    end

    puts ""
    puts "To remove these players, run: rake players:remove_ineligible"
    puts ""
  end

  desc "Remove players with no stats in target year and no contract"
  task remove_ineligible: :environment do
    puts "\n🗑️  Removing ineligible players..."
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

    # Confirmation prompt
    print "⚠️  This will permanently delete ineligible players. Continue? (yes/no): "
    confirmation = STDIN.gets.chomp.downcase

    unless confirmation == 'yes'
      puts "❌ Cancelled"
      exit 0
    end

    players_with_contracts = Contract.where(active: true)
      .where('first_season_id <= ?', current_season.id)
      .where('last_season_id >= ?', current_season.id)
      .pluck(:player_id)

    players = Player.where.not(bbrefid: [nil, ''])
      .where.not(id: players_with_contracts)

    puts "Checking #{players.count} players..."
    puts ""

    deleted_count = 0

    players.find_each do |player|
      player_stat = PlayerStat.find_by(player: player, season: current_season)
      should_delete = false

      if player_stat.nil? || player_stat.stats.empty?
        should_delete = true
      else
        stats = player_stat.stats
        is_pitcher = player.positions&.any? { |p| ['SP', 'RP'].include?(p) }

        if is_pitcher
          ip = stats['IP']&.to_f || 0
          should_delete = true if ip == 0
        else
          pa = stats['PA']&.to_i || 0
          should_delete = true if pa == 0
        end
      end

      if should_delete
        print "\r  Deleted #{deleted_count + 1}: #{player.name}"

        # Delete associated records first to avoid foreign key constraints
        # This includes any inactive contracts from previous seasons
        player.contracts.destroy_all if player.contracts.any?
        player.player_stats.destroy_all if player.player_stats.any?

        # Delete any bids referencing this player
        Bid.where(player_id: player.id).destroy_all

        player.destroy
        deleted_count += 1
      end
    end

    puts "\n"
    puts "=" * 80
    puts "✅ Deleted #{deleted_count} ineligible players"
    puts ""
  end
end
