namespace :fa_report do
  desc 'Generate 2026 Free Agent Class Report'
  task generate_2026: :environment do
    require 'net/http'
    require 'json'
    require 'csv'

    puts "\n🔍 GENERATING 2026 FREE AGENT CLASS REPORT"
    puts "=" * 80
    puts ""

    # Step 1: Get all 2026 players from MLB Stats API
    puts "📊 Fetching all 2026 players from MLB Stats API..."
    uri = URI('https://statsapi.mlb.com/api/v1/sports/1/players?season=2026')
    response = Net::HTTP.get_response(uri)

    unless response.is_a?(Net::HTTPSuccess)
      puts "❌ Failed to fetch from MLB API"
      exit 1
    end

    mlb_data = JSON.parse(response.body)
    mlb_players = mlb_data['people'] || []

    puts "   Found #{mlb_players.count} players in MLB 2026 season"
    puts ""

    # Step 2: Load Chadwick Register to map MLB IDs to BBRef IDs
    puts "🗺️  Loading ID mappings from Chadwick Register..."
    chadwick_uri = URI('https://raw.githubusercontent.com/chadwickbureau/register/master/data/people.csv')

    begin
      chadwick_response = Net::HTTP.get_response(chadwick_uri)
      mlb_to_bbref = {}

      if chadwick_response.is_a?(Net::HTTPSuccess)
        CSV.parse(chadwick_response.body, headers: true) do |row|
          mlb_id = row['key_mlbam']
          bbref_id = row['key_bbref']

          if mlb_id && bbref_id && !mlb_id.empty? && !bbref_id.empty?
            mlb_to_bbref[mlb_id.to_i] = bbref_id
          end
        end

        puts "   Loaded #{mlb_to_bbref.size} ID mappings"
      else
        puts "   ⚠️  Failed to load Chadwick Register (#{chadwick_response.code})"
        mlb_to_bbref = {}
      end
    rescue => e
      puts "   ⚠️  Error loading Chadwick Register: #{e.message}"
      mlb_to_bbref = {}
    end
    puts ""

    # Step 3: Map MLB players to BBRef IDs
    puts "🔗 Mapping MLB players to BBRef IDs..."
    mlb_players_with_bbref = []

    mlb_players.each do |player|
      mlb_id = player['id']
      bbrefid = mlb_to_bbref[mlb_id]

      if bbrefid
        mlb_players_with_bbref << {
          mlb_id: mlb_id,
          bbrefid: bbrefid,
          name: player['fullName'],
          position: player.dig('primaryPosition', 'abbreviation') || 'P'
        }
      end
    end

    puts "   Mapped #{mlb_players_with_bbref.count} players to BBRef IDs"
    puts ""

    # Step 4: Load local Player database
    puts "💾 Analyzing local Player database..."
    local_bbrefids = Player.where.not(bbrefid: [nil, '']).pluck(:bbrefid).to_set
    local_minors = Player.where.not(bbref_minors: [nil, '']).pluck(:bbref_minors).to_set

    puts "   Local database has #{Player.count} players"
    puts "   #{local_bbrefids.size} with bbrefid, #{local_minors.size} with bbref_minors"
    puts ""

    # Step 5: Identify missing players
    puts "🔎 Identifying missing players..."
    missing_players = mlb_players_with_bbref.reject do |mlb_player|
      local_bbrefids.include?(mlb_player[:bbrefid]) ||
        local_minors.include?(mlb_player[:bbrefid])
    end

    puts "   Found #{missing_players.count} players in 2026 MLB not in database"
    puts ""

    # Step 6: Identify current FAs and expiring contracts
    players_without_contracts = Player.where.not(
      id: Contract.where(active: true).select(:player_id)
    )

    expiring_contracts = Contract.where(
      active: true,
      last_season_id: Season.current.id
    ).includes(:player)

    puts "   #{players_without_contracts.count} players without active contracts"
    puts "   #{expiring_contracts.count} contracts expiring this season"
    puts ""

    # Step 7: Generate report
    report_path = Rails.root.join('2026_FREE_AGENT_CLASS.md')

    File.open(report_path, 'w') do |f|
      f.puts "# 2026 Free Agent Class Report"
      f.puts ""
      f.puts "Generated: #{Time.now.strftime('%Y-%m-%d %H:%M:%S')}"
      f.puts ""
      f.puts "## Summary"
      f.puts ""
      f.puts "- **Total 2026 MLB Players**: #{mlb_players.count}"
      f.puts "- **Mapped to BBRef IDs**: #{mlb_players_with_bbref.count}"
      f.puts "- **Players in Database**: #{Player.count}"
      f.puts "- **Players without Contracts**: #{players_without_contracts.count}"
      f.puts "- **Contracts Expiring**: #{expiring_contracts.count}"
      f.puts "- **NEW Players (not in database)**: #{missing_players.count}"
      f.puts ""
      f.puts "---"
      f.puts ""

      f.puts "## Part 1: New Players to Add (#{missing_players.count})"
      f.puts ""
      f.puts "These players have 2026 MLB stats but are NOT in the database:"
      f.puts ""

      if missing_players.any?
        missing_players.sort_by { |p| p[:name] }.each do |player|
          f.puts "- **#{player[:name]}** (#{player[:position]}) - `#{player[:bbrefid]}`"
        end
      else
        f.puts "_No missing players - database is up to date!_"
      end

      f.puts ""
      f.puts "---"
      f.puts ""

      f.puts "## Part 2: Contracts Expiring This Season (#{expiring_contracts.count})"
      f.puts ""
      f.puts "These players' contracts will expire and they'll become free agents:"
      f.puts ""

      expiring_contracts.includes(:team).order('players.name').each do |contract|
        player = contract.player
        positions = player.positions.join(', ')
        f.puts "- **#{player.name}** (#{positions}) from #{contract.team.name} - `#{player.bbrefid}`"
      end

      f.puts ""
      f.puts "---"
      f.puts ""

      f.puts "## Part 3: Existing Free Agents (#{players_without_contracts.count})"
      f.puts ""
      f.puts "Players already in database with no active contracts:"
      f.puts ""

      players_without_contracts.order(:name).each do |player|
        positions = player.positions.join(', ')
        f.puts "- **#{player.name}** (#{positions}) - `#{player.bbrefid}`"
      end

      f.puts ""
      f.puts "---"
      f.puts ""
      f.puts "## Next Steps for Commissioner"
      f.puts ""
      f.puts "1. **Add New Players**: Import the #{missing_players.count} new players via RailsAdmin"
      f.puts "2. **Switch Season**: Run `rake season:switch` to expire contracts"
      f.puts "3. **Recalculate FAs**: Run `rake free_agents:recalculate` to mark eligible players"
      f.puts "4. **Activate FA Period**: Enable free agency period in RailsAdmin"
    end

    puts "=" * 80
    puts "✅ REPORT GENERATED: #{report_path}"
    puts "=" * 80
    puts ""
  end
end
