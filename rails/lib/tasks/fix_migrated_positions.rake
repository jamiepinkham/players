namespace :data do
  desc 'Fix positions that were migrated with dirty data'
  task fix_migrated_positions: :environment do
    puts 'FIXING MIGRATED POSITIONS'
    puts '=' * 80
    puts ''

    # Position code mapping (from original fix_positions.rake)
    # Note: 1 = P (pitcher), but we default to RP for position array
    # 7/8/9 = LF/CF/RF, which all become OF
    POSITION_MAP = {
      '1' => 'RP',  # Pitcher - default to RP (can be SP or RP)
      '2' => 'C',
      '3' => '1B',
      '4' => '2B',
      '5' => '3B',
      '6' => 'SS',
      '7' => 'OF',  # Left field
      '8' => 'OF',  # Center field
      '9' => 'OF'   # Right field
    }

    def clean_position(position)
      return nil if position.blank?

      # Remove asterisks and whitespace
      cleaned = position.gsub('*', '').strip

      # If it's a single digit, map it directly
      if cleaned =~ /^\d$/
        return POSITION_MAP[cleaned]
      end

      # If it's already a valid position, return it
      return cleaned if Player::POSITIONS.include?(cleaned)

      # Try to extract valid positions from complex codes
      # Common patterns: "HD" = DH, "D" alone = DH, numbers with H/D suffixes

      # Check for DH variants
      if cleaned =~ /^(DH?|HD)$/
        return 'DH'
      end

      # Single digit with H or D suffix - take just the number
      if cleaned =~ /^(\d)[HD]*$/
        return POSITION_MAP[$1]
      end

      # For complex multi-digit codes, try to find a valid position
      # Look for standalone valid abbreviations first
      Player::POSITIONS.each do |pos|
        return pos if cleaned.include?(pos) && pos.length > 1
      end

      # Try single-digit extraction as last resort
      if cleaned =~ /(\d)/
        mapped = POSITION_MAP[$1]
        return mapped if mapped && Player::POSITIONS.include?(mapped)
      end

      # Convert LF/CF/RF to OF
      return 'OF' if ['LF', 'CF', 'RF'].any? { |of_pos| cleaned.include?(of_pos) }

      # If we can't figure it out, return nil
      nil
    end

    fixed_count = 0
    skipped_count = 0

    Player.where.not(positions: nil).find_each do |player|
      old_positions = player.positions.dup
      new_positions = []

      # Clean each position
      old_positions.each do |pos|
        cleaned = clean_position(pos)
        new_positions << cleaned if cleaned.present?
      end

      # Remove duplicates and invalid positions
      new_positions = new_positions.uniq & Player::POSITIONS

      if new_positions.sort != old_positions.sort
        puts "  #{player.name}: #{old_positions.inspect} → #{new_positions.inspect}"
        player.update_column(:positions, new_positions)
        fixed_count += 1
      else
        skipped_count += 1
      end
    end

    puts ''
    puts '=' * 80
    puts "Fixed: #{fixed_count} players"
    puts "Skipped (already clean): #{skipped_count} players"
    puts ''
    puts "Now run: rails free_agents:recalculate"
  end
end
