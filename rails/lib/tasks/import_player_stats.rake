namespace :stats do
  desc 'Import stats for a single player by BBRef ID'
  task :import_player, [:bbrefid] => :environment do |t, args|
    unless args.bbrefid
      puts "ERROR: Please provide bbrefid"
      puts "Usage: rake stats:import_player[playername01]"
      exit 1
    end

    player = Player.find_by(bbrefid: args.bbrefid)
    unless player
      puts "ERROR: Player not found with bbrefid: #{args.bbrefid}"
      exit 1
    end

    current_season = Season.current
    unless current_season&.target_stat_year
      puts "ERROR: Current season has no target_stat_year configured"
      exit 1
    end

    puts "Importing stats for #{player.name} (#{current_season.target_stat_year})"
    puts ""

    # Run the import for just this player
    # This will use the existing FanGraphs import logic
    ENV['BBREFIDS'] = args.bbrefid
    system("bin/rails stats:import")

    puts ""
    puts "✓ Import complete for #{player.name}"
  end
end
