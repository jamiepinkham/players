namespace :stats do
  desc "Populate player_stats table for all free agents"
  task populate: :environment do
    puts "\n📊 Populating player_stats for free agents..."
    puts "=" * 80

    current_season = Season.current
    unless current_season
      puts "❌ No active season found"
      exit 1
    end

    target_year = current_season.target_stat_year
    unless target_year
      puts "❌ No target stat year set for #{current_season.name}"
      exit 1
    end

    puts "Season: #{current_season.name}"
    puts "Target stat year: #{target_year}"
    puts ""

    players = Player.where.not(bbrefid: [nil, ''])
    total = players.count

    puts "Players to populate: #{total}"
    puts ""

    created = 0
    updated = 0
    errors = 0

    players.find_each.with_index do |player, index|
      begin
        player_stat = PlayerStat.fetch_or_create_for(player, current_season)

        if player_stat
          if player_stat.previously_new_record?
            created += 1
            status = "→ created"
          else
            updated += 1
            status = "✓ exists"
          end
        else
          errors += 1
          status = "✗ failed"
        end

        print "\r[#{index + 1}/#{total}] #{status} #{player.name.ljust(30)}"

      rescue => e
        errors += 1
        puts "\n❌ Error for #{player.name}: #{e.message}"
      end
    end

    puts "\n"
    puts "=" * 80
    puts "✅ Complete!"
    puts "   Created: #{created}"
    puts "   Already existed: #{updated}"
    puts "   Errors: #{errors}"
    puts ""
  end

  desc "Clear all player stats"
  task clear: :environment do
    puts "\n🗑️  Clearing all player stats..."
    count = PlayerStat.count
    PlayerStat.delete_all
    puts "✓ Deleted #{count} player stat records"
    puts ""
  end
end
