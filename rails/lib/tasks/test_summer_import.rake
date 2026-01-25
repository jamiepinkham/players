require 'csv'

namespace :summer_draft do
  desc "Test import summer draft from CSV"
  task import_test: :environment do
    file_path = Rails.root.join('lib', 'summer_draft_test.csv')

    puts "\n🏈 Importing Summer Draft"
    puts "=" * 80

    # Get current season and calculate +5 seasons
    current_season = Season.current
    puts "Current Season: #{current_season.name} (ID: #{current_season.id})"

    # Calculate last season (+5 from current)
    last_season = current_season
    5.times do |i|
      last_season = last_season.next_season
      unless last_season
        puts "❌ Error: Cannot find season +#{i+1} from current."
        exit 1
      end
      puts "  +#{i+1}: #{last_season.name} (ID: #{last_season.id})"
    end

    puts "\nFirst Season: #{current_season.name} (ID: #{current_season.id})"
    puts "Last Season: #{last_season.name} (ID: #{last_season.id})"

    results = {
      contracts_created: 0,
      players_created: 0,
      errors: []
    }

    CSV.foreach(file_path, headers: true) do |row|
      begin
        player_name = row['Player Name']
        team_name = row['Team']
        bbrefid = row['BBREF ID']
        bbref_minors = row['Minors BBREF ID']
        position = row['BBREF Position']

        # Validate required fields
        unless player_name && team_name && position
          results[:errors] << "Row missing required fields: #{row.to_h}"
          next
        end

        # Must have either bbrefid or bbref_minors
        unless bbrefid.present? || bbref_minors.present?
          results[:errors] << "#{player_name}: Must have either BBREF ID or Minors BBREF ID"
          next
        end

        # Find team
        team = Team.find_by(name: team_name)
        unless team
          results[:errors] << "#{player_name}: Team '#{team_name}' not found"
          next
        end

        # Find or create player
        player = if bbrefid.present?
          Player.find_or_initialize_by(bbrefid: bbrefid)
        else
          Player.find_or_initialize_by(bbref_minors: bbref_minors)
        end

        was_new_player = player.new_record?

        # Set player attributes
        player.name = player_name
        player.position = position
        player.bbrefid = bbrefid if bbrefid.present?
        player.bbref_minors = bbref_minors if bbref_minors.present?

        player.save!
        results[:players_created] += 1 if was_new_player

        # Create contract
        contract = Contract.new(
          player: player,
          team: team,
          amount: 500_000,
          summer: true,
          active: bbrefid.present?,
          first_season: current_season,
          last_season: last_season
        )

        contract.save!
        results[:contracts_created] += 1

        puts "✓ #{player_name} -> #{team_name} (Active: #{contract.active})"

      rescue => e
        results[:errors] << "#{row['Player Name']}: #{e.message}"
        puts "✗ #{row['Player Name']}: #{e.message}"
      end
    end

    puts "\n" + "=" * 80
    puts "✅ Import Complete!"
    puts "=" * 80
    puts "Contracts created: #{results[:contracts_created]}"
    puts "Players created: #{results[:players_created]}"
    puts "Errors: #{results[:errors].count}"

    if results[:errors].any?
      puts "\n❌ Errors:"
      results[:errors].each { |e| puts "  - #{e}" }
    end

    puts ""
  end
end
