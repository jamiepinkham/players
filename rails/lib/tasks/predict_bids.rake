namespace :stats do
  desc 'Predict winning bids for top 5 2026 free agents by WAR'
  task predict_top_bids: :environment do
    # Current season is BMPL 2026 (id: 6), using 2025 stats
    current_season = Season.current

    unless current_season
      puts "ERROR: Could not find current season"
      exit 1
    end

    puts "Analyzing Free Agency: #{current_season.name}"
    puts "Using stats from: #{current_season.target_stat_year}"
    puts "=" * 80
    puts ""

    # Find all free agents for current season
    free_agents = Player.where(is_free_agent: true)

    puts "Found #{free_agents.count} free agents"
    puts ""

    # Get WAR stats for each free agent
    free_agent_wars = []

    free_agents.each do |player|
      player_stat = PlayerStat.find_by(player: player, season: current_season)
      war = player_stat&.stats&.dig('WAR')&.to_f

      next unless war && war > 0

      free_agent_wars << {
        player: player,
        war: war,
        position: player.position || 'Unknown'
      }
    end

    # Sort by WAR descending and take top 5
    top_5 = free_agent_wars.sort_by { |fa| -fa[:war] }.take(5)

    if top_5.empty?
      puts "No free agents with WAR data found"
      exit 0
    end

    puts "TOP 5 FREE AGENTS BY WAR"
    puts "=" * 80
    puts ""

    # Historical $/WAR data from BMPL 2025 analysis
    # These are the averages from last year's free agency
    position_dollar_per_war = {
      'C' => 918_000,
      '1B' => 2_148_000,
      '2B' => 1_698_000,
      '3B' => 1_905_000,
      'SS' => 1_874_000,
      'LF' => 1_634_000,
      'CF' => 2_028_000,
      'RF' => 2_058_000,
      'OF' => 1_906_000,
      'SP' => 2_161_000,
      'RP' => 1_734_000,
      'DH' => 1_842_000, # Use overall average for DH
    }

    overall_avg = 1_842_403

    # Get max contract length from current free agency period
    max_contract_length = current_season.active_free_agency_period&.max_contract_length || 3

    top_5.each_with_index do |fa, idx|
      player = fa[:player]
      war = fa[:war]
      position = fa[:position]

      puts "#{idx + 1}. #{player.name} (#{position})"
      puts "   WAR: #{war.round(1)}"
      puts ""

      # Get position-specific $/WAR, fallback to overall average
      base_dollar_per_war = position_dollar_per_war[position] || overall_avg

      # Apply elite player premium for WAR > 5.0
      # Top players command a premium above market rate
      multiplier = case war
                   when 0..3.0 then 1.0
                   when 3.0..4.0 then 1.1
                   when 4.0..5.0 then 1.2
                   else 1.3 # Elite players (WAR > 5)
                   end

      adjusted_dollar_per_war = (base_dollar_per_war * multiplier).round(0)

      puts "   Position average $/WAR (BMPL 2025): #{format_currency(base_dollar_per_war)}"
      puts "   Elite player adjustment: #{(multiplier * 100).round(0)}%"
      puts "   Adjusted $/WAR: #{format_currency(adjusted_dollar_per_war)}"
      puts ""

      # Predict for different contract lengths
      puts "   PREDICTED WINNING BIDS:"
      (1..max_contract_length).each do |years|
        # Longer contracts typically get slight premium per year
        contract_multiplier = 1.0 + (years - 1) * 0.05
        annual_bid = (war * adjusted_dollar_per_war * contract_multiplier).round(0)
        total_bid = annual_bid * years

        puts "   #{years} year#{years > 1 ? 's' : ''}: #{format_currency(annual_bid)}/year (Total: #{format_currency(total_bid)})"
      end

      puts ""
      puts "   RECOMMENDATION:"

      # Recommend optimal contract length based on WAR
      recommended_years = case war
                          when 0..2.0 then 1
                          when 2.0..3.5 then 2
                          else 3
                          end

      contract_multiplier = 1.0 + (recommended_years - 1) * 0.05
      recommended_annual = (war * adjusted_dollar_per_war * contract_multiplier).round(0)
      recommended_total = recommended_annual * recommended_years

      puts "   #{recommended_years}-year contract at #{format_currency(recommended_annual)}/year"
      puts "   Total commitment: #{format_currency(recommended_total)}"
      puts "   Rationale: #{get_rationale(war, position, recommended_years)}"

      puts ""
      puts "-" * 80
      puts ""
    end

    # Summary statistics
    puts "=" * 80
    puts "ANALYSIS NOTES"
    puts "=" * 80
    puts ""
    puts "• Predictions based on BMPL 2025 free agency market rates"
    puts "• Elite player premium applied for WAR > 4.0 (#{multiplier_for(4.0)}% increase)"
    puts "• Long-term contract premium: 5% per additional year"
    puts "• Position-specific market rates factored in"
    puts "• Actual winning bids may vary based on team needs and competition"
    puts ""
    puts "Position Market Rates ($/WAR) from BMPL 2025:"
    position_dollar_per_war.sort.each do |pos, rate|
      puts "  #{pos.ljust(10)} #{format_currency(rate)}"
    end
  end

  def format_currency(amount)
    "$#{number_with_delimiter(amount.round(0))}"
  end

  def number_with_delimiter(number)
    number.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
  end

  def multiplier_for(war)
    return 100 if war < 3.0
    return 110 if war < 4.0
    return 120 if war < 5.0
    130
  end

  def get_rationale(war, position, years)
    rationales = []

    if war > 5.0
      rationales << "Elite production (#{war.round(1)} WAR) justifies premium multi-year investment"
    elsif war > 4.0
      rationales << "Strong production (#{war.round(1)} WAR) warrants long-term security"
    elsif war > 3.0
      rationales << "Solid production (#{war.round(1)} WAR) with moderate term commitment"
    else
      rationales << "Good value player (#{war.round(1)} WAR) best suited for short-term deal"
    end

    if ['C', 'SS', 'CF', 'SP'].include?(position)
      rationales << "premium position adds strategic value"
    end

    if years == 1
      rationales << "flexibility for both team and player"
    elsif years == 3
      rationales << "team controls prime years while providing player security"
    end

    rationales.join(", ")
  end
end
