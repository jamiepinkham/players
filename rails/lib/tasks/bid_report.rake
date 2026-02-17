namespace :bids do
  desc "Generate daily bid conversion report"
  task daily_report: :environment do
    fap = Season.current&.active_free_agency_period

    if fap.nil?
      puts "No active free agency period"
      exit
    end

    # Collect data
    contracts_to_create = []
    new_leading_single = []
    competitive_bids = []

    leading_player_ids = fap.bids.leading.distinct.pluck(:player_id)
    player_bid_counts = fap.bids.active.group(:player_id).count

    # Process each player with a leading bid
    leading_player_ids.each do |player_id|
      player = Player.find(player_id)
      leading_bid = fap.bids.leading.where(player_id: player_id).max_by(&:total_amount)
      active_bids = fap.bids.active.where(player_id: player_id).to_a
      highest_active = active_bids.max_by(&:total_amount)

      next unless leading_bid

      if highest_active && highest_active.total_amount > leading_bid.total_amount
        # Active bid will overtake - should not happen but include for completeness
        all_bids = active_bids.sort_by { |b| -b.total_amount }
        competitive_bids << {
          player: player,
          bids: all_bids,
          winner: highest_active
        }
      else
        # Leading bid will convert
        contracts_to_create << {
          player: player,
          bid: leading_bid
        }
      end
    end

    # Find new leading bids
    all_active_player_ids = fap.bids.active.distinct.pluck(:player_id)

    (all_active_player_ids - leading_player_ids).each do |player_id|
      player = Player.find(player_id)
      active_bids = fap.bids.active.where(player_id: player_id).to_a
      highest_active = active_bids.max_by(&:total_amount)

      next unless highest_active

      bid_count = player_bid_counts[player_id] || 0

      if bid_count == 1
        new_leading_single << {
          player: player,
          bid: highest_active
        }
      else
        all_bids = active_bids.sort_by { |b| -b.total_amount }
        competitive_bids << {
          player: player,
          bids: all_bids,
          winner: highest_active
        }
      end
    end

    # Generate Report
    puts "=" * 100
    puts "DAILY BID CONVERSION REPORT"
    puts "Free Agency Period: #{fap.season.name}"
    puts "Report Date: #{Time.current.strftime('%Y-%m-%d %I:%M %p %Z')}"
    puts "=" * 100

    puts "\n📊 SUMMARY"
    puts "-" * 100
    puts "Contracts to be created: #{contracts_to_create.count}"
    puts "New leading bids (uncontested): #{new_leading_single.count}"
    puts "Competitive situations: #{competitive_bids.count}"
    puts "Total teams that will be outbid: #{competitive_bids.sum { |c| c[:bids].count - 1 }}"

    # Contracts Section
    puts "\n\n📋 CONTRACTS TO BE CREATED (#{contracts_to_create.count})"
    puts "-" * 100
    contracts_to_create.sort_by { |c| -c[:bid].total_amount }.each do |item|
      bid = item[:bid]
      puts "\n#{item[:player].name.ljust(30)} → #{bid.team.name}"
      puts "  Amount: $#{format_money(bid.annual_amount)}/yr × #{bid.contract_length} years = $#{format_money(bid.total_amount)}"
      puts "  Seasons: #{bid.first_season.name} - #{bid.last_season.name}"
    end

    # New Leading Bids (Uncontested)
    puts "\n\n🆕 NEW LEADING BIDS - UNCONTESTED (#{new_leading_single.count})"
    puts "-" * 100
    new_leading_single.sort_by { |n| -n[:bid].total_amount }.each do |item|
      bid = item[:bid]
      puts "\n#{item[:player].name.ljust(30)} → #{bid.team.name}"
      puts "  Amount: $#{format_money(bid.annual_amount)}/yr × #{bid.contract_length} years = $#{format_money(bid.total_amount)}"
      puts "  Seasons: #{bid.first_season.name} - #{bid.last_season.name}"
    end

    # Competitive Bids
    puts "\n\n⚔️  COMPETITIVE SITUATIONS (#{competitive_bids.count})"
    puts "-" * 100
    competitive_bids.sort_by { |c| -c[:winner].total_amount }.each do |item|
      puts "\n#{item[:player].name} (#{item[:bids].count} bids)"
      puts "  ✓ WINNER: #{item[:winner].team.name.ljust(35)} $#{format_money(item[:winner].total_amount)} total"

      item[:bids][1..-1].each do |losing_bid|
        puts "  ✗ OUTBID: #{losing_bid.team.name.ljust(35)} $#{format_money(losing_bid.total_amount)} total"
      end
    end

    # Teams Summary
    puts "\n\n👥 TEAMS SUMMARY"
    puts "-" * 100

    # Contracts by team
    contracts_by_team = contracts_to_create.group_by { |c| c[:bid].team }
    puts "\nTeams signing contracts:"
    contracts_by_team.sort_by { |team, items| -items.count }.each do |team, items|
      total_value = items.sum { |i| i[:bid].total_amount }
      puts "  #{team.name.ljust(40)} #{items.count} player(s), $#{format_money(total_value)} total"
    end

    # Winning bids by team
    winning_bids_by_team = competitive_bids.group_by { |c| c[:winner].team }
    puts "\nTeams winning competitive bids:"
    winning_bids_by_team.sort_by { |team, items| -items.count }.each do |team, items|
      total_value = items.sum { |i| i[:winner].total_amount }
      puts "  #{team.name.ljust(40)} #{items.count} player(s), $#{format_money(total_value)} total"
    end

    # Teams getting outbid
    outbid_by_team = Hash.new(0)
    competitive_bids.each do |item|
      item[:bids][1..-1].each do |losing_bid|
        outbid_by_team[losing_bid.team] += 1
      end
    end

    if outbid_by_team.any?
      puts "\nTeams getting outbid:"
      outbid_by_team.sort_by { |team, count| -count }.each do |team, count|
        puts "  #{team.name.ljust(40)} #{count} bid(s) lost"
      end
    end

    puts "\n" + "=" * 100
    puts "End of Report"
    puts "=" * 100
  end

  def format_money(amount)
    amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
  end
end
