namespace :stats do
  desc 'Historical analysis of $/WAR for elite starting pitchers over past 4 seasons'
  task pitcher_war_history: :environment do
    # Get the last 4 seasons (2023-2026)
    current_season = Season.current
    seasons = Season.where(id: (current_season.id - 3)..current_season.id).order(:id)

    if seasons.count < 4
      puts "ERROR: Not enough seasons for 4-year analysis"
      exit 1
    end

    puts "ELITE STARTING PITCHER $/WAR ANALYSIS"
    puts "Historical trends over #{seasons.first.name} - #{seasons.last.name}"
    puts "=" * 80
    puts ""

    # Define elite as WAR >= 3.0 for starting pitchers
    elite_threshold = 3.0

    seasonal_data = []

    seasons.each do |season|
      puts "#{season.name} (Stats: #{season.target_stat_year})"
      puts "-" * 80

      # Get all active contracts for this season
      contracts = Contract.where(active: true)
        .where('first_season_id <= ?', season.id)
        .where('last_season_id >= ?', season.id)
        .includes(:player)

      # Filter to starting pitchers with elite WAR
      elite_pitchers = []

      contracts.each do |contract|
        player = contract.player
        next unless player.positions&.include?('SP')

        # Get player stats for this season from StatsFetcher (synchronous for rake task)
        stats = StatsFetcher.fetch_for_player(player, season.target_stat_year, async: false)
        war = stats&.dig('WAR')&.to_f

        next unless war && war >= elite_threshold

        annual_amount = contract.amount
        dollar_per_war = annual_amount / war

        elite_pitchers << {
          player: player,
          team: contract.team,
          war: war,
          amount: annual_amount,
          dollar_per_war: dollar_per_war,
          contract: contract
        }
      end

      if elite_pitchers.empty?
        puts "  No elite starting pitchers (WAR >= #{elite_threshold}) found"
        puts ""
        next
      end

      # Calculate statistics
      total_war = elite_pitchers.sum { |p| p[:war] }
      total_dollars = elite_pitchers.sum { |p| p[:amount] }
      avg_dollar_per_war = total_dollars / total_war
      median_dollar_per_war = elite_pitchers.map { |p| p[:dollar_per_war] }.sort[elite_pitchers.size / 2]

      puts "  Elite SPs (WAR >= #{elite_threshold}): #{elite_pitchers.count}"
      puts "  Average $/WAR: #{format_currency(avg_dollar_per_war)}"
      puts "  Median $/WAR: #{format_currency(median_dollar_per_war)}"
      puts "  Total WAR: #{total_war.round(1)}"
      puts "  Total dollars: #{format_currency(total_dollars)}"
      puts ""

      # Show top 5 by WAR
      puts "  Top 5 by WAR:"
      elite_pitchers.sort_by { |p| -p[:war] }.take(5).each do |p|
        puts "    #{p[:player].name.ljust(25)} | WAR: #{p[:war].to_s.rjust(4)} | #{format_currency(p[:amount]).rjust(12)} | $/WAR: #{format_currency(p[:dollar_per_war])}"
      end
      puts ""

      # Show top 5 most efficient (lowest $/WAR)
      puts "  Top 5 Best Value (lowest $/WAR):"
      elite_pitchers.sort_by { |p| p[:dollar_per_war] }.take(5).each do |p|
        puts "    #{p[:player].name.ljust(25)} | WAR: #{p[:war].to_s.rjust(4)} | #{format_currency(p[:amount]).rjust(12)} | $/WAR: #{format_currency(p[:dollar_per_war])}"
      end
      puts ""

      # Store for trend analysis
      seasonal_data << {
        season: season,
        count: elite_pitchers.count,
        avg_dollar_per_war: avg_dollar_per_war,
        median_dollar_per_war: median_dollar_per_war,
        total_war: total_war,
        pitchers: elite_pitchers
      }
    end

    # Trend analysis
    puts "=" * 80
    puts "TREND ANALYSIS"
    puts "=" * 80
    puts ""

    if seasonal_data.length >= 2
      first_season = seasonal_data.first
      last_season = seasonal_data.last

      avg_change = last_season[:avg_dollar_per_war] - first_season[:avg_dollar_per_war]
      avg_pct_change = (avg_change / first_season[:avg_dollar_per_war] * 100).round(1)

      median_change = last_season[:median_dollar_per_war] - first_season[:median_dollar_per_war]
      median_pct_change = (median_change / first_season[:median_dollar_per_war] * 100).round(1)

      puts "Average $/WAR Trend:"
      seasonal_data.each do |data|
        puts "  #{data[:season].name}: #{format_currency(data[:avg_dollar_per_war])}"
      end
      puts ""
      puts "  Change: #{avg_change > 0 ? '+' : ''}#{format_currency(avg_change)} (#{avg_pct_change > 0 ? '+' : ''}#{avg_pct_change}%)"
      puts ""

      puts "Median $/WAR Trend:"
      seasonal_data.each do |data|
        puts "  #{data[:season].name}: #{format_currency(data[:median_dollar_per_war])}"
      end
      puts ""
      puts "  Change: #{median_change > 0 ? '+' : ''}#{format_currency(median_change)} (#{median_pct_change > 0 ? '+' : ''}#{median_pct_change}%)"
      puts ""

      puts "Elite Pitcher Supply:"
      seasonal_data.each do |data|
        puts "  #{data[:season].name}: #{data[:count]} pitchers (#{data[:total_war].round(1)} total WAR)"
      end
      puts ""
    end

    # Cross-season best values
    puts "=" * 80
    puts "BEST VALUES ACROSS ALL SEASONS"
    puts "=" * 80
    puts ""

    all_pitchers = seasonal_data.flat_map do |data|
      data[:pitchers].map { |p| p.merge(season: data[:season]) }
    end

    puts "Top 10 Most Efficient Elite SP Contracts (lowest $/WAR):"
    all_pitchers.sort_by { |p| p[:dollar_per_war] }.take(10).each_with_index do |p, idx|
      puts "  #{(idx + 1).to_s.rjust(2)}. #{p[:player].name.ljust(25)} | #{p[:season].name} | WAR: #{p[:war].to_s.rjust(4)} | $/WAR: #{format_currency(p[:dollar_per_war])}"
    end
    puts ""

    puts "Top 10 Highest WAR Seasons:"
    all_pitchers.sort_by { |p| -p[:war] }.take(10).each_with_index do |p, idx|
      puts "  #{(idx + 1).to_s.rjust(2)}. #{p[:player].name.ljust(25)} | #{p[:season].name} | WAR: #{p[:war].to_s.rjust(4)} | $/WAR: #{format_currency(p[:dollar_per_war])}"
    end
    puts ""

    # Market efficiency analysis
    puts "=" * 80
    puts "MARKET EFFICIENCY INSIGHTS"
    puts "=" * 80
    puts ""

    # Find pitchers who appeared in multiple seasons
    pitcher_ids = all_pitchers.map { |p| p[:player].id }
    multi_season_pitchers = pitcher_ids.group_by(&:itself).select { |k, v| v.count > 1 }.keys

    if multi_season_pitchers.any?
      puts "Pitchers with multiple elite seasons:"
      multi_season_pitchers.each do |player_id|
        pitcher_seasons = all_pitchers.select { |p| p[:player].id == player_id }
        player_name = pitcher_seasons.first[:player].name

        puts "  #{player_name}:"
        pitcher_seasons.sort_by { |p| p[:season].id }.each do |ps|
          puts "    #{ps[:season].name}: #{ps[:war].to_s.rjust(4)} WAR at #{format_currency(ps[:dollar_per_war])}/WAR"
        end
        puts ""
      end
    end

    # WAR tier analysis
    puts "WAR Tier Analysis (all seasons combined):"
    tiers = [
      { name: "Ace (WAR >= 5.0)", min: 5.0, max: 999 },
      { name: "Elite (4.0-4.9)", min: 4.0, max: 4.9 },
      { name: "Strong (3.0-3.9)", min: 3.0, max: 3.9 }
    ]

    tiers.each do |tier|
      tier_pitchers = all_pitchers.select { |p| p[:war] >= tier[:min] && p[:war] <= tier[:max] }
      next if tier_pitchers.empty?

      avg_war = tier_pitchers.sum { |p| p[:war] } / tier_pitchers.count
      avg_amount = tier_pitchers.sum { |p| p[:amount] } / tier_pitchers.count
      avg_dollar_per_war = tier_pitchers.sum { |p| p[:dollar_per_war] } / tier_pitchers.count

      puts "  #{tier[:name]}:"
      puts "    Count: #{tier_pitchers.count} contracts"
      puts "    Avg WAR: #{avg_war.round(2)}"
      puts "    Avg Salary: #{format_currency(avg_amount)}"
      puts "    Avg $/WAR: #{format_currency(avg_dollar_per_war)}"
      puts ""
    end
  end

  def format_currency(amount)
    "$#{number_with_delimiter(amount.round(0))}"
  end

  def number_with_delimiter(number)
    number.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
  end
end
