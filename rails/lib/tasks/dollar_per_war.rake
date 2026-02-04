namespace :stats do
  desc 'Calculate dollar per WAR by position for last year\'s free agency'
  task dollar_per_war: :environment do
    # Current season is BMPL 2026 (id: 6), so last year was BMPL 2025 (id: 5)
    last_season = Season.find_by(name: 'BMPL 2025')

    unless last_season
      puts "ERROR: Could not find BMPL 2025 season"
      exit 1
    end

    puts "Analyzing Free Agency: #{last_season.name}"
    puts "Using stats from: #{last_season.target_stat_year}"
    puts "=" * 80
    puts ""

    # Find all contracts created during that season's free agency
    # Contracts have a winning_bid_id that links to the bid
    contracts = Contract.joins(:winning_bid)
      .where(first_season: last_season)
      .includes(:player, :winning_bid)

    puts "Found #{contracts.count} contracts from #{last_season.name} free agency"
    puts ""

    # Group by position and calculate stats
    position_data = {}

    contracts.each do |contract|
      player = contract.player
      position = player.position || 'Unknown'

      # Get player stats for that year
      player_stat = PlayerStat.find_by(player: player, season: last_season)
      war = player_stat&.stats&.dig('WAR')&.to_f

      next unless war && war > 0 # Skip if no WAR data

      annual_amount = contract.amount
      dollar_per_war = annual_amount / war

      position_data[position] ||= {
        count: 0,
        total_war: 0,
        total_dollars: 0,
        contracts: []
      }

      position_data[position][:count] += 1
      position_data[position][:total_war] += war
      position_data[position][:total_dollars] += annual_amount
      position_data[position][:contracts] << {
        player: player.name,
        war: war,
        amount: annual_amount,
        dollar_per_war: dollar_per_war
      }
    end

    # Display results
    puts "DOLLAR PER WAR BY POSITION"
    puts "=" * 80
    puts ""

    # Sort by position
    position_data.keys.sort.each do |position|
      data = position_data[position]
      avg_dollar_per_war = data[:total_dollars] / data[:total_war]

      puts "#{position.ljust(15)} | Players: #{data[:count].to_s.rjust(3)} | Avg $/WAR: #{format_currency(avg_dollar_per_war)}"

      # Show individual contracts
      data[:contracts].sort_by { |c| c[:dollar_per_war] }.each do |c|
        puts "  #{c[:player].ljust(25)} | WAR: #{c[:war].to_s.rjust(5)} | Amount: #{format_currency(c[:amount]).rjust(12)} | $/WAR: #{format_currency(c[:dollar_per_war])}"
      end
      puts ""
    end

    # Summary stats
    puts "=" * 80
    puts "SUMMARY"
    puts "=" * 80
    total_contracts = position_data.values.sum { |d| d[:count] }
    total_war = position_data.values.sum { |d| d[:total_war] }
    total_dollars = position_data.values.sum { |d| d[:total_dollars] }
    overall_avg = total_dollars / total_war

    puts "Total contracts with WAR data: #{total_contracts}"
    puts "Total WAR: #{total_war.round(1)}"
    puts "Total dollars: #{format_currency(total_dollars)}"
    puts "Overall average $/WAR: #{format_currency(overall_avg)}"
  end

  def format_currency(amount)
    "$#{number_with_delimiter(amount.round(0))}"
  end

  def number_with_delimiter(number)
    number.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
  end
end
