require 'csv'

namespace :free_agents do
  desc "Export free agents to CSV using GraphQL API"
  task export: :environment do
    puts "\n🆓 Exporting Free Agents to CSV"
    puts "=" * 80

    positions = ['SP', 'RP', 'C', '1B', '2B', '3B', 'SS', 'OF']
    all_free_agents = []

    # Query each position
    positions.each do |position|
      query_string = <<~GRAPHQL
        query {
          players(position: "#{position}") {
            id
            name
            position
            bbrefid
            bbrefLink
            bbrefStats
          }
        }
      GRAPHQL

      result = BmplFinancesSchema.execute(query_string)

      if result["errors"]
        puts "❌ GraphQL Errors for position #{position}:"
        result["errors"].each { |error| puts "   #{error['message']}" }
        next
      end

      players = result.dig("data", "players") || []
      all_free_agents.concat(players)
      print "\r   Fetched #{position.ljust(3)}: #{players.count.to_s.rjust(3)} players"
    end

    puts "\n✓ Total free agents found: #{all_free_agents.count}"

    # Generate timestamp for filename
    timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
    filename = "free_agents_#{timestamp}.csv"

    # Create CSV
    CSV.open(filename, "w") do |csv|
      # Write header
      csv << [
        "Player Name",
        "Player ID",
        "Position",
        "BBRef ID",
        "BBRef Link",
        "Age",
        "Team (2024)",
        "G",
        "AB",
        "R",
        "H",
        "2B",
        "3B",
        "HR",
        "RBI",
        "SB",
        "CS",
        "BB",
        "SO",
        "BA",
        "OBP",
        "SLG",
        "OPS",
        "OPS+",
        "TB",
        "GDP",
        "HBP",
        "SH",
        "SF",
        "IBB",
        # Pitching stats
        "W",
        "L",
        "ERA",
        "G_P",
        "GS",
        "GF",
        "CG",
        "SHO",
        "SV",
        "IP",
        "H_P",
        "R_P",
        "ER",
        "HR_P",
        "BB_P",
        "IBB_P",
        "SO_P",
        "HBP_P",
        "BK",
        "WP",
        "BF",
        "ERA+",
        "FIP",
        "WHIP",
        "H9",
        "HR9",
        "BB9",
        "SO9",
        "SO/W"
      ]

      # Write data for each free agent
      all_free_agents.each do |player|
        stats = player["bbrefStats"] || {}

        # Basic stats that appear in the hash with different keys
        batting_stats = [
          stats["Age"],
          stats["Tm"],
          stats["G"],
          stats["AB"],
          stats["R"],
          stats["H"],
          stats["2B"],
          stats["3B"],
          stats["HR"],
          stats["RBI"],
          stats["SB"],
          stats["CS"],
          stats["BB"],
          stats["SO"],
          stats["BA"],
          stats["OBP"],
          stats["SLG"],
          stats["OPS"],
          stats["OPS+"],
          stats["TB"],
          stats["GDP"],
          stats["HBP"],
          stats["SH"],
          stats["SF"],
          stats["IBB"]
        ]

        pitching_stats = [
          stats["W"],
          stats["L"],
          stats["ERA"],
          stats["G"],
          stats["GS"],
          stats["GF"],
          stats["CG"],
          stats["SHO"],
          stats["SV"],
          stats["IP"],
          stats["H"],
          stats["R"],
          stats["ER"],
          stats["HR"],
          stats["BB"],
          stats["IBB"],
          stats["SO"],
          stats["HBP"],
          stats["BK"],
          stats["WP"],
          stats["BF"],
          stats["ERA+"],
          stats["FIP"],
          stats["WHIP"],
          stats["H9"],
          stats["HR9"],
          stats["BB9"],
          stats["SO9"],
          stats["SO/W"]
        ]

        csv << [
          player["name"],
          player["id"],
          player["position"] || "N/A",
          player["bbrefid"] || "",
          player["bbrefLink"] || "",
          *batting_stats,
          *pitching_stats
        ]
      end
    end

    puts "\n✅ Export complete!"
    puts "   • File: #{filename}"
    puts "   • Total free agents: #{all_free_agents.count}"

    # Show summary by position
    puts "\n📋 Summary by Position:"
    by_position = all_free_agents.group_by { |p| p["position"] || "Unknown" }
    by_position.sort_by { |pos, _| pos }.each do |position, players|
      puts "   • #{position.ljust(10)} #{players.count} players"
    end

    puts ""
  end

  desc "Export free agents to CSV (compact format)"
  task export_compact: :environment do
    puts "\n🆓 Exporting Free Agents (Compact) to CSV"
    puts "=" * 80

    positions = ['SP', 'RP', 'C', '1B', '2B', '3B', 'SS', 'OF']
    all_free_agents = []

    positions.each do |position|
      query_string = <<~GRAPHQL
        query {
          players(position: "#{position}") {
            id
            name
            position
            bbrefLink
            bbrefStats
          }
        }
      GRAPHQL

      result = BmplFinancesSchema.execute(query_string)
      players = result.dig("data", "players") || []
      all_free_agents.concat(players)
      print "\r   Fetched: #{all_free_agents.count} players"
    end

    puts "\n✓ Total free agents found: #{all_free_agents.count}"

    timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
    filename = "free_agents_compact_#{timestamp}.csv"

    CSV.open(filename, "w") do |csv|
      # Compact header
      csv << ["Name", "Position", "Age", "Team", "BA/ERA", "HR/W", "RBI/SO", "OPS/WHIP", "BBRef Link"]

      all_free_agents.each do |player|
        stats = player["bbrefStats"] || {}
        position = player["position"] || "N/A"

        # Show different stats for pitchers vs position players
        if ['SP', 'RP'].include?(position)
          primary_stat = stats["ERA"]
          secondary_stat = stats["W"]
          tertiary_stat = stats["SO"]
          fourth_stat = stats["WHIP"]
        else
          primary_stat = stats["BA"]
          secondary_stat = stats["HR"]
          tertiary_stat = stats["RBI"]
          fourth_stat = stats["OPS"]
        end

        csv << [
          player["name"],
          position,
          stats["Age"],
          stats["Tm"],
          primary_stat,
          secondary_stat,
          tertiary_stat,
          fourth_stat,
          player["bbrefLink"]
        ]
      end
    end

    puts "✅ Compact free agents exported to #{filename}"
    puts ""
  end
end
