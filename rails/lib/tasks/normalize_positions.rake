namespace :data do
  desc "Normalize bbref position codes to readable positions"
  task normalize_positions: :environment do
    # Map bbref position codes to standardized positions
    POSITION_MAP = {
      '1' => 'P',
      '2' => 'C',
      '3' => '1B',
      '4' => '2B',
      '5' => '3B',
      '6' => 'SS',
      '7' => 'LF',
      '8' => 'CF',
      '9' => 'RF',
      'D' => 'DH',
      'H' => 'DH',  # Sometimes H is used for DH
      'P' => 'P',   # Already normalized
      'SP' => 'SP',
      'RP' => 'RP',
      'C' => 'C',   # Already normalized
      '1B' => '1B',
      '2B' => '2B',
      '3B' => '3B',
      'SS' => 'SS',
      'LF' => 'LF',
      'CF' => 'CF',
      'RF' => 'RF',
      'OF' => 'OF',
      'DH' => 'DH'
    }

    puts "\n🔄 Normalizing player positions..."
    puts "=" * 80

    total = Player.count
    updated = 0
    unchanged = 0
    errors = 0

    Player.find_each.with_index do |player, index|
      begin
        next if player.positions.blank?

        original_positions = player.positions.dup
        normalized = []

        player.positions.each do |pos|
          next if pos.blank?

          # Handle multi-character position codes (e.g., "D8" = DH + CF)
          if pos.length > 1 && !['1B', '2B', '3B', 'SP', 'RP', 'OF', 'DH', 'SS', 'CF', 'LF', 'RF'].include?(pos)
            # Split into individual characters and map each
            pos.chars.each do |char|
              mapped = POSITION_MAP[char]
              normalized << mapped if mapped
            end
          else
            # Single character or already normalized position
            mapped = POSITION_MAP[pos]
            normalized << (mapped || pos)
          end
        end

        # Convert specific outfield positions to generic OF
        normalized = normalized.map do |pos|
          ['LF', 'CF', 'RF'].include?(pos) ? 'OF' : pos
        end

        # Remove duplicates and sort
        normalized = normalized.uniq.sort

        if normalized != original_positions
          player.update_column(:positions, normalized)
          updated += 1
          print "\r[#{index + 1}/#{total}] Updated: #{player.name.ljust(30)} #{original_positions.inspect} → #{normalized.inspect}"
        else
          unchanged += 1
        end

      rescue => e
        errors += 1
        puts "\n❌ Error for #{player.name} (ID: #{player.id}): #{e.message}"
      end
    end

    puts "\n"
    puts "=" * 80
    puts "✅ Normalization complete!"
    puts "   Total players: #{total}"
    puts "   Updated: #{updated}"
    puts "   Unchanged: #{unchanged}"
    puts "   Errors: #{errors}"
    puts ""

    # Show sample of updated players
    puts "Sample of normalized positions:"
    Player.where.not(positions: []).limit(10).each do |p|
      puts "  #{p.name.ljust(30)} #{p.positions.inspect}"
    end
    puts ""
  end
end
