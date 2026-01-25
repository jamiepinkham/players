require 'csv'

namespace :rosters do
  desc "Export team rosters to CSV using GraphQL API"
  task export: :environment do
    puts "\n📊 Exporting Team Rosters to CSV"
    puts "=" * 80

    # GraphQL query to fetch all teams with their current contracts
    query_string = <<~GRAPHQL
      query {
        teams {
          id
          name
          currentPayroll
          availableCash
          totalPlayers
          currentContracts {
            id
            amount
            active
            firstSeason {
              name
            }
            lastSeason {
              name
            }
            player {
              id
              name
              position
              bbrefid
            }
          }
        }
      }
    GRAPHQL

    # Execute the GraphQL query
    result = BmplFinancesSchema.execute(query_string)

    if result["errors"]
      puts "❌ GraphQL Errors:"
      result["errors"].each { |error| puts "   #{error['message']}" }
      exit 1
    end

    teams = result["data"]["teams"]
    puts "✓ Found #{teams.count} teams"

    # Generate timestamp for filename
    timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
    filename = "team_rosters_#{timestamp}.csv"
    total_contracts = 0

    # Create CSV
    CSV.open(filename, "w") do |csv|
      # Write header
      csv << [
        "Team Name",
        "Team ID",
        "Player Name",
        "Player ID",
        "Position",
        "Salary",
        "First Season",
        "Last Season",
        "Contract Years",
        "Active",
        "BBRef ID"
      ]

      # Write data for each team
      teams.each do |team|
        team_name = team["name"]
        team_id = team["id"]

        contracts = team["currentContracts"] || []

        contracts.each do |contract|
          player = contract["player"]
          next unless player

          first_season = contract["firstSeason"]&.dig("name") || "N/A"
          last_season = contract["lastSeason"]&.dig("name") || "N/A"

          # Calculate contract years if both seasons are available
          contract_years = "N/A"
          if first_season != "N/A" && last_season != "N/A"
            # Extract year from season name (e.g., "BMPL 2021" -> 2021)
            first_year = first_season.scan(/\d{4}/).first.to_i
            last_year = last_season.scan(/\d{4}/).first.to_i
            contract_years = (last_year - first_year + 1).to_s if first_year > 0 && last_year > 0
          end

          csv << [
            team_name,
            team_id,
            player["name"],
            player["id"],
            player["position"] || "N/A",
            contract["amount"] || 0.0,
            first_season,
            last_season,
            contract_years,
            contract["active"] ? "Yes" : "No",
            player["bbrefid"] || ""
          ]
          total_contracts += 1
        end
      end
    end

    puts "\n✅ Export complete!"
    puts "   • File: #{filename}"
    puts "   • Teams: #{teams.count}"
    puts "   • Total contracts: #{total_contracts}"

    # Show summary by team
    puts "\n📋 Summary by Team:"
    teams.sort_by { |t| t["name"] }.each do |team|
      contract_count = (team["currentContracts"] || []).count
      payroll = team["currentPayroll"] || 0
      puts "   • #{team['name'].ljust(35)} #{contract_count.to_s.rjust(3)} players  $#{payroll.round(1)}"
    end

    puts ""
  end

  desc "Export team rosters to CSV (compact format)"
  task export_compact: :environment do
    timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
    filename = "team_rosters_compact_#{timestamp}.csv"

    query_string = <<~GRAPHQL
      query {
        teams {
          name
          currentContracts {
            amount
            player {
              name
              position
            }
            firstSeason { name }
            lastSeason { name }
          }
        }
      }
    GRAPHQL

    result = BmplFinancesSchema.execute(query_string)
    teams = result.dig("data", "teams") || []

    CSV.open(filename, "w") do |csv|
      csv << ["Team", "Player", "Position", "Salary", "Years"]

      teams.each do |team|
        (team["currentContracts"] || []).each do |contract|
          player = contract["player"]
          next unless player

          first_year = contract["firstSeason"]&.dig("name")&.scan(/\d{4}/)&.first.to_i
          last_year = contract["lastSeason"]&.dig("name")&.scan(/\d{4}/)&.first.to_i
          years = (first_year > 0 && last_year > 0) ? (last_year - first_year + 1) : "?"

          csv << [
            team["name"],
            player["name"],
            player["position"] || "N/A",
            contract["amount"] || 0.0,
            years
          ]
        end
      end
    end

    puts "✅ Compact roster exported to #{filename}"
  end
end
