namespace :seasons do
  desc "Create missing BMPL 2030 and 2031 seasons"
  task create_missing: :environment do
    puts "\n🔧 Creating Missing Seasons"
    puts "=" * 80

    # Create BMPL 2030
    season_2030 = Season.create!(
      name: 'BMPL 2030',
      is_active: false,
      is_finished: false,
      previous_season_id: 24
    )
    puts "✓ Created BMPL 2030 (ID: #{season_2030.id})"

    # Create BMPL 2031
    season_2031 = Season.create!(
      name: 'BMPL 2031',
      is_active: false,
      is_finished: false,
      previous_season_id: season_2030.id
    )
    puts "✓ Created BMPL 2031 (ID: #{season_2031.id})"

    # Link BMPL 2029 -> 2030
    Season.find(24).update!(next_season_id: season_2030.id)
    puts "✓ Linked BMPL 2029 -> BMPL 2030"

    # Link BMPL 2030 -> 2031
    season_2030.update!(next_season_id: season_2031.id)
    puts "✓ Linked BMPL 2030 -> BMPL 2031"

    puts "\n" + "=" * 80
    puts "✅ Season chain complete!"
    puts "=" * 80

    puts "\nSeason chain verification:"
    season = Season.current
    6.times do |i|
      puts "  #{season.name}"
      season = season.next_season
      break unless season
    end

    puts ""
  end
end
