namespace :season do
  desc "Switch to the next season"
  task switch: :environment do
    puts "\n🔄 BMPL Season Switch"
    puts "=" * 80

    # Get current season
    current_season = Season.current
    unless current_season
      puts "❌ Error: No active season found"
      exit 1
    end

    # Get next season
    next_season = current_season.next_season
    unless next_season
      puts "❌ Error: No next season configured for #{current_season.name}"
      puts "   Please create the next season and link it via previous_season_id"
      exit 1
    end

    puts "\n📅 Current Season: #{current_season.name} (ID: #{current_season.id})"
    puts "📅 Next Season:    #{next_season.name} (ID: #{next_season.id})"
    puts ""

    # Show what will be affected
    expiring_contracts = Contract.where(active: true, last_season_id: current_season.id)
    active_fa_periods = current_season.free_agency_periods.where(is_active: true)
    active_bids = Bid.where(is_active: true)

    puts "📊 Current State:"
    puts "   • Expiring contracts: #{expiring_contracts.count}"
    puts "   • Active free agency periods: #{active_fa_periods.count}"
    puts "   • Active bids: #{active_bids.count}"
    puts ""

    # Confirmation
    print "⚠️  This will deactivate #{expiring_contracts.count} contracts and switch seasons.\n"
    print "   Continue? (yes/no): "
    confirmation = STDIN.gets.chomp.downcase

    unless confirmation == 'yes'
      puts "❌ Season switch cancelled"
      exit 0
    end

    puts "\n🚀 Starting season switch..."
    puts ""

    ActiveRecord::Base.transaction do
      # Step 1: Deactivate expiring contracts
      puts "Step 1: Deactivating expiring contracts..."
      deactivated_count = 0
      expiring_contracts.find_each do |contract|
        contract.update!(active: false)
        deactivated_count += 1
        print "\r   Progress: #{deactivated_count}/#{expiring_contracts.count}"
      end
      puts "\n   ✓ Deactivated #{deactivated_count} contracts"

      # Step 2: Deactivate current free agency periods
      puts "\nStep 2: Deactivating current free agency periods..."
      active_fa_periods.update_all(is_active: false)
      puts "   ✓ Deactivated #{active_fa_periods.count} free agency periods"

      # Step 3: Deactivate active bids
      puts "\nStep 3: Deactivating active bids..."
      active_bids.update_all(is_active: false)
      puts "   ✓ Deactivated #{active_bids.count} bids"

      # Step 4: Switch active season
      puts "\nStep 4: Switching active season..."
      current_season.update!(is_active: false)
      next_season.update!(is_active: true)
      puts "   ✓ #{current_season.name} marked inactive"
      puts "   ✓ #{next_season.name} marked active"

      # Step 5: Create free agency period for new season (inactive by default)
      puts "\nStep 5: Creating free agency period for #{next_season.name}..."

      # Check if one already exists
      existing_fa = next_season.free_agency_periods.first
      if existing_fa
        puts "   ✓ Free agency period already exists (ID: #{existing_fa.id})"
        puts "   ℹ️  Status: #{existing_fa.is_active? ? 'ACTIVE' : 'INACTIVE'}"
      else
        # Use the season's start and end dates
        # Note: is_active defaults to false - admins activate when ready
        fa_period = next_season.free_agency_periods.create!(
          is_active: false,
          max_bids_for_team: 7,
          start_date: next_season.start_date,
          end_date: next_season.end_date
        )
        puts "   ✓ Created new free agency period (ID: #{fa_period.id}, inactive)"
      end

      puts "\n" + "=" * 80
      puts "✅ Season switch complete!"
      puts "=" * 80
    end

    # Verification
    puts "\n📊 New State:"
    new_current = Season.current
    puts "   • Active season: #{new_current.name}"

    active_contracts_count = Contract.where(active: true).count
    puts "   • Active contracts: #{active_contracts_count}"

    free_agents_count = Player.where(is_free_agent: true).count
    puts "   • Free agents: #{free_agents_count}"

    active_fa = FreeAgencyPeriod.where(is_active: true).includes(:season).first
    if active_fa
      puts "   • Active free agency period: #{active_fa.season.name} (max bids: #{active_fa.max_bids_for_team})"
    end

    # Check for issues
    puts "\n🔍 Verification:"
    old_contracts = Contract.where(active: true).where('last_season_id <= ?', current_season.id).count
    if old_contracts > 0
      puts "   ⚠️  WARNING: #{old_contracts} contracts from old season still active!"
    else
      puts "   ✓ No contracts from old season are active"
    end

    puts "\n📝 Next Steps:"
    puts "   1. Test the application"
    puts "   2. Activate free agency period when ready (via Rails Admin or console)"
    puts "   3. Notify team owners that the new season has started"
    puts "   4. Monitor for any issues"
    puts ""
  end

  desc "Show current season information"
  task status: :environment do
    puts "\n📅 BMPL Season Status"
    puts "=" * 80

    current = Season.current
    if current
      puts "\n✓ Active Season: #{current.name} (ID: #{current.id})"

      if current.previous_season
        puts "  Previous: #{current.previous_season.name}"
      end

      if current.next_season
        puts "  Next: #{current.next_season.name}"
      else
        puts "  ⚠️  No next season configured"
      end

      puts "\n📊 Statistics:"

      active_contracts = Contract.where(active: true)
      puts "  • Active contracts: #{active_contracts.count}"

      expiring_contracts = active_contracts.where(last_season_id: current.id)
      puts "  • Expiring this season: #{expiring_contracts.count}"

      fa_period = current.active_free_agency_period
      if fa_period
        puts "  • Free agency period: Active (max bids: #{fa_period.max_bids_for_team})"
        active_bids = Bid.where(is_active: true, free_agency_period: fa_period)
        puts "  • Active bids: #{active_bids.count}"
      else
        puts "  • Free agency period: None active"
      end

      puts "\n📋 All Seasons:"
      Season.order(:id).each do |season|
        status = season.is_active? ? "✓ ACTIVE" : "  "
        puts "  #{status} #{season.name.ljust(15)} (ID: #{season.id})"
      end
    else
      puts "\n❌ No active season found"
    end

    puts ""
  end

  desc "Preview what will happen in next season switch"
  task preview: :environment do
    puts "\n🔍 Season Switch Preview"
    puts "=" * 80

    current_season = Season.current
    unless current_season
      puts "❌ Error: No active season found"
      exit 1
    end

    next_season = current_season.next_season
    unless next_season
      puts "❌ Error: No next season configured"
      exit 1
    end

    puts "\n📅 Will switch from: #{current_season.name} → #{next_season.name}"
    puts ""

    # Show expiring contracts by team
    puts "📋 Contracts Expiring (will be deactivated):"
    expiring_contracts = Contract
      .where(active: true, last_season_id: current_season.id)
      .includes(:player, :team)
      .order('teams.name, players.name')

    by_team = expiring_contracts.group_by(&:team)
    by_team.each do |team, contracts|
      total_salary = contracts.sum(&:amount)
      puts "\n  #{team.name} (#{contracts.count} players, $#{total_salary.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse})"
      contracts.first(5).each do |contract|
        puts "    • #{contract.player.name.ljust(25)} #{contract.player.position.ljust(8)} $#{contract.amount.to_i}"
      end
      if contracts.count > 5
        puts "    ... and #{contracts.count - 5} more"
      end
    end

    puts "\n📊 Summary:"
    puts "  • Total expiring: #{expiring_contracts.count} contracts"
    puts "  • Teams affected: #{by_team.keys.count}"
    puts "  • Total salary freed: $#{expiring_contracts.sum(&:amount).to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"

    puts "\n🔄 Other Changes:"
    active_fa_periods = current_season.free_agency_periods.where(is_active: true)
    puts "  • Free agency periods to deactivate: #{active_fa_periods.count}"

    active_bids = Bid.where(is_active: true)
    puts "  • Active bids to deactivate: #{active_bids.count}"

    puts "\n✅ Season #{next_season.name} will become active"
    existing_fa = next_season.free_agency_periods.first
    if existing_fa
      puts "  • Will activate existing free agency period"
    else
      puts "  • Will create new free agency period (max 7 bids per team)"
    end

    puts ""
  end
end
