# Migrate position data from production export to local positions arrays
# This replicates the logic from the ChangePositionToPositionsArray migration

puts "Reading production position data..."
position_data = {}

# Read from the file in rails/tmp
File.readlines(Rails.root.join('tmp', 'production_positions.txt')).each do |line|
  id, position = line.strip.split('|')
  next if id.nil? || position.nil? || position.empty?

  position_data[id.to_i] = position
end

puts "Processing #{position_data.count} players..."

success_count = 0
error_count = 0

position_data.each do |player_id, old_position|
  begin
    # Split position string by "/" to handle multi-position players
    position_parts = old_position.split('/')

    # Map each part to the standardized position
    positions = position_parts.map do |pos|
      pos = pos.strip

      # Convert specific outfield positions to generic OF
      if ['LF', 'CF', 'RF'].include?(pos)
        'OF'
      else
        pos
      end
    end.uniq # Remove duplicates

    # Update the player
    player = Player.find_by(id: player_id)
    if player
      player.update_column(:positions, positions)
      success_count += 1
      print "." if success_count % 100 == 0
    else
      puts "\nWarning: Player ID #{player_id} not found"
      error_count += 1
    end
  rescue => e
    puts "\nError processing player ID #{player_id}: #{e.message}"
    error_count += 1
  end
end

puts "\n\nMigration complete!"
puts "Successfully updated: #{success_count} players"
puts "Errors: #{error_count}"

# Show sample of updated players
puts "\nSample of updated players:"
Player.where.not(positions: []).limit(10).each do |p|
  puts "  #{p.name}: #{p.positions.inspect}"
end
