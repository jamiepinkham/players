namespace :stats do
  desc 'Export player_stats table to SQL file'
  task export: :environment do
    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    filename = "player_stats_#{timestamp}.sql"

    puts "Exporting player_stats table..."
    puts "Output file: #{filename}"

    # Get database config
    config = ActiveRecord::Base.connection_db_config.configuration_hash

    # Build pg_dump command for just the player_stats table
    cmd = [
      'pg_dump',
      '-h', config[:host] || 'localhost',
      '-U', config[:username] || 'postgres',
      '-d', config[:database],
      '-t', 'player_stats',
      '--data-only',
      '--inserts',
      '-f', filename
    ]

    # Set password via environment if present
    env = {}
    env['PGPASSWORD'] = config[:password] if config[:password]

    system(env, *cmd)

    if $?.success?
      file_size = File.size(filename) / 1024.0 / 1024.0
      count = PlayerStats.count
      puts "✅ Export complete!"
      puts "   Records: #{count}"
      puts "   File size: #{file_size.round(2)} MB"
      puts ""
      puts "To import to another environment:"
      puts "  psql -U postgres -d database_name < #{filename}"
    else
      puts "❌ Export failed"
    end
  end

  desc 'Import player_stats from SQL file'
  task :import, [:filename] => :environment do |t, args|
    filename = args[:filename]

    unless filename
      puts "Usage: rails stats:import[filename.sql]"
      exit 1
    end

    unless File.exist?(filename)
      puts "File not found: #{filename}"
      exit 1
    end

    puts "Importing player_stats from #{filename}..."

    # Get database config
    config = ActiveRecord::Base.connection_db_config.configuration_hash

    # Truncate existing data
    puts "Truncating existing player_stats..."
    PlayerStats.delete_all

    # Build psql command
    cmd = [
      'psql',
      '-h', config[:host] || 'localhost',
      '-U', config[:username] || 'postgres',
      '-d', config[:database],
      '-f', filename
    ]

    # Set password via environment if present
    env = {}
    env['PGPASSWORD'] = config[:password] if config[:password]

    system(env, *cmd)

    if $?.success?
      count = PlayerStats.count
      puts "✅ Import complete!"
      puts "   Records: #{count}"
    else
      puts "❌ Import failed"
    end
  end
end
