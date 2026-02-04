require 'csv'
require 'json'
require 'open3'

namespace :stats do
  desc 'Import stats for free agents from FanGraphs (via pybaseball)'
  task import: :environment do
    # Get the season (current by default, or specified via SEASON_ID)
    if ENV['SEASON_ID']
      current_season = Season.find(ENV['SEASON_ID'])
    else
      current_season = Season.current
    end

    unless current_season&.target_stat_year
      puts "ERROR: Cannot import stats - target_stat_year not configured"
      exit 1
    end

    year = current_season.target_stat_year

    # Get list of players to import
    if ENV['BBREFIDS']
      bbrefids = ENV['BBREFIDS'].split(',').map(&:strip)
      players = Player.where(bbrefid: bbrefids)
      puts "Importing stats for #{players.count} specified players (#{year})..."
    elsif ENV['ALL_PLAYERS']
      players = Player.where.not(bbrefid: [nil, ''])
      puts "Importing stats for ALL #{players.count} players (#{year})..."
    else
      players = Player.where(is_free_agent: true).where.not(bbrefid: [nil, ''])
      puts "Importing stats for #{players.count} free agents (#{year})..."
    end

    if players.empty?
      puts "No players to import!"
      exit 0
    end

    puts ""

    # ========================================
    # Fetch stats from FanGraphs via pybaseball
    # ========================================
    puts "Fetching stats from FanGraphs (#{year})..."

    python_script = Rails.root.join('lib', 'scripts', 'fetch_fangraphs_stats.py')

    # Run the Python script to fetch stats
    # Set environment to ensure UTF-8 encoding
    env = { 'PYTHONIOENCODING' => 'utf-8', 'LC_ALL' => 'en_US.UTF-8' }
    stdout, stderr, status = Open3.capture3(
      env, 'python3', python_script.to_s, year.to_s
    )

    # Ensure stdout is read as UTF-8
    stdout.force_encoding('UTF-8')

    unless status.success?
      puts "ERROR: Failed to fetch stats from FanGraphs"
      puts stderr
      exit 1
    end

    # Show Python script progress messages
    puts stderr if stderr.present?

    # Parse JSON output
    begin
      fg_data = JSON.parse(stdout)
      batting_stats = fg_data['batting'] || {}
      pitching_stats = fg_data['pitching'] || {}
      fielding_positions = fg_data['positions'] || {}
    rescue JSON::ParserError => e
      puts "ERROR: Failed to parse JSON output"
      puts "Output: #{stdout[0..500]}"
      exit 1
    end

    puts "  Batting: #{batting_stats.size} players"
    puts "  Pitching: #{pitching_stats.size} players"
    puts "  Fielding positions: #{fielding_positions.size} players"
    puts ""

    # ========================================
    # Match and save to database
    # ========================================
    puts "Matching players and saving to database..."

    saved_count = 0
    updated_count = 0
    skipped_count = 0
    matched_count = 0
    unmatched_bbrefids = []

    players.each do |player|
      bbref_id = player.bbrefid

      # Try to find stats in FanGraphs data by BBRef ID
      batting_data = batting_stats[bbref_id]
      pitching_data = pitching_stats[bbref_id]

      # Extract stats and player info
      batting = batting_data&.dig('stats')
      batting_info = batting_data&.dig('player_info')
      pitching = pitching_data&.dig('stats')
      pitching_info = pitching_data&.dig('player_info')

      # Update player name from FanGraphs (prefer batting, fall back to pitching)
      fg_name = batting_info&.dig('Name') || pitching_info&.dig('Name')
      if fg_name && player.name != fg_name
        puts "  Updating player name: #{player.name} → #{fg_name}"
        player.update!(name: fg_name)
      end

      # Update position from FanGraphs
      # Use fielding_stats for position players (C, 1B, 2B, SS, LF, CF, RF, etc.)
      # Classify pitchers as SP/RP based on games started

      fg_position = fielding_positions[bbref_id]  # From fielding_stats (returns "P" for pitchers)

      # If fielding_stats says "P", ignore it - we'll classify as SP/RP below
      fg_position = nil if fg_position == 'P'

      if pitching && !batting
        # Pitcher only (not a position player) - classify as SP or RP
        games_started = pitching['GS']&.to_f || 0
        pitcher_position = games_started > 5 ? 'SP' : 'RP'

        if player.position != pitcher_position
          puts "  Classifying pitcher: #{player.name} (#{player.position || 'none'} → #{pitcher_position}, GS: #{games_started.to_i})"
          player.update!(position: pitcher_position)
        end
      elsif batting && pitching
        # Player has both batting and pitching stats
        # Determine if they're truly two-way based on actual stats, not current position
        plate_appearances = batting['PA']&.to_i || 0
        innings_pitched = pitching['IP']&.to_f || 0

        # True two-way: meaningful playing time at both (like Ohtani)
        # PA >= 100 indicates regular position player duty
        # IP > 20 indicates meaningful pitching role
        if plate_appearances >= 100 && innings_pitched > 20
          games_started = pitching['GS']&.to_f || 0
          pitcher_position = games_started > 5 ? 'SP' : 'RP'

          # Use fielding position if available, otherwise DH
          base_position = fg_position || 'DH'
          new_pos = "#{base_position}/#{pitcher_position}"

          if player.position != new_pos
            puts "  Two-way player: #{player.name} (#{player.position || 'none'} → #{new_pos}, PA: #{plate_appearances}, IP: #{innings_pitched.round(1)}, GS: #{games_started.to_i})"
            player.update!(position: new_pos)
          end
        elsif innings_pitched > 20 && plate_appearances < 100
          # Primarily a pitcher (pitchers who bat occasionally in NL)
          games_started = pitching['GS']&.to_f || 0
          pitcher_position = games_started > 5 ? 'SP' : 'RP'

          if player.position != pitcher_position
            puts "  Classifying pitcher: #{player.name} (#{player.position || 'none'} → #{pitcher_position}, GS: #{games_started.to_i})"
            player.update!(position: pitcher_position)
          end
        elsif fg_position && player.position != fg_position
          # Position player with incidental pitching - just update their fielding position
          puts "  Updating position: #{player.name} (#{player.position || 'none'} → #{fg_position})"
          player.update!(position: fg_position)
        elsif !fg_position && plate_appearances >= 100 && player.position != 'DH'
          # Has batting stats but no fielding position - likely a DH
          puts "  Designating DH: #{player.name} (#{player.position || 'none'} → DH, PA: #{plate_appearances})"
          player.update!(position: 'DH')
        end
      elsif fg_position && player.position != fg_position
        # Pure position player - update from fielding data
        puts "  Updating position: #{player.name} (#{player.position || 'none'} → #{fg_position})"
        player.update!(position: fg_position)
      elsif batting && !fg_position
        # Has batting stats but no fielding position - likely a DH
        plate_appearances = batting['PA']&.to_i || 0
        if plate_appearances >= 100 && player.position != 'DH'
          puts "  Designating DH: #{player.name} (#{player.position || 'none'} → DH, PA: #{plate_appearances})"
          player.update!(position: 'DH')
        end
      end

      # Combine stats
      combined_stats = {}

      if batting
        combined_stats.merge!(batting)
        matched_count += 1
      end

      if pitching
        # For two-way players, keep batting stats and only add pitching-specific fields
        if batting
          pitching_only = pitching.slice('W', 'L', 'ERA', 'GS', 'SV', 'IP', 'ER', 'WHIP', 'WAR')

          # Sum WAR for two-way players
          if combined_stats['WAR'] && pitching_only['WAR']
            combined_war = combined_stats['WAR'].to_f + pitching_only['WAR'].to_f
            pitching_only.delete('WAR')
            combined_stats['WAR'] = combined_war.round(1).to_s
          end

          combined_stats.merge!(pitching_only)
        else
          combined_stats.merge!(pitching)
          matched_count += 1
        end
      end

      # Skip if no stats found
      if combined_stats.empty?
        unmatched_bbrefids << bbref_id
        skipped_count += 1
        next
      end

      # Save or update PlayerStat
      player_stat = PlayerStat.find_or_initialize_by(player_id: player.id, season_id: current_season.id)

      if player_stat.new_record?
        player_stat.stats = combined_stats
        player_stat.save!
        saved_count += 1
      else
        player_stat.stats = combined_stats
        player_stat.save!
        updated_count += 1
      end
    end

    puts ""
    puts "✓ Import complete!"
    puts "  #{saved_count} new player stat records created"
    puts "  #{updated_count} existing records updated"
    puts "  #{matched_count} players matched to FanGraphs"
    puts "  #{skipped_count} players skipped (no stats found)"

    if unmatched_bbrefids.any?
      puts ""
      puts "  Unmatched BBRef IDs (first 10):"
      unmatched_bbrefids.first(10).each do |bbref_id|
        player = Player.find_by(bbrefid: bbref_id)
        puts "    - #{bbref_id} (#{player&.name || 'unknown'})"
      end
    end

    puts ""
    puts "Stats are now stored in the database for the #{current_season.name} season!"
  end
end
