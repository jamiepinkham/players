namespace :contracts do
  desc "Update contracts with nil first_season_id to use the first season"
  task fix_nil_first_seasons: :environment do
    puts "\n🔧 Fix Contracts with nil first_season_id"
    puts "=" * 80

    # Get the first season
    first_season = Season.order(:id).first
    unless first_season
      puts "❌ Error: No seasons found in database"
      exit 1
    end

    puts "\n📅 First Season: #{first_season.name} (ID: #{first_season.id})"

    # Find contracts with nil first_season_id
    contracts_to_update = Contract.where(first_season_id: nil)
    puts "📊 Contracts to update: #{contracts_to_update.count}"

    if contracts_to_update.count == 0
      puts "\n✅ No contracts need updating"
      exit 0
    end

    # Show some examples
    puts "\n📋 Sample contracts to update (first 5):"
    contracts_to_update.includes(:player, :team).limit(5).each do |contract|
      player_name = contract.player&.name || "Unknown"
      team_name = contract.team&.name || "Unknown"
      puts "  • #{player_name.ljust(25)} (#{team_name})"
    end

    if contracts_to_update.count > 5
      puts "  ... and #{contracts_to_update.count - 5} more"
    end

    # Confirmation
    print "\n⚠️  This will update #{contracts_to_update.count} contracts.\n"
    print "   Continue? (yes/no): "
    confirmation = STDIN.gets.chomp.downcase

    unless confirmation == 'yes'
      puts "❌ Update cancelled"
      exit 0
    end

    puts "\n🚀 Starting update..."

    ActiveRecord::Base.transaction do
      updated_count = 0
      contracts_to_update.find_each do |contract|
        contract.update!(first_season_id: first_season.id)
        updated_count += 1
        print "\r   Progress: #{updated_count}/#{contracts_to_update.count}"
      end
      puts "\n   ✓ Updated #{updated_count} contracts"
    end

    puts "\n" + "=" * 80
    puts "✅ Update complete!"
    puts "=" * 80

    # Verification
    remaining = Contract.where(first_season_id: nil).count
    puts "\n🔍 Verification:"
    if remaining > 0
      puts "   ⚠️  WARNING: #{remaining} contracts still have nil first_season_id!"
    else
      puts "   ✓ All contracts now have a first_season_id"
    end

    puts ""
  end
end
