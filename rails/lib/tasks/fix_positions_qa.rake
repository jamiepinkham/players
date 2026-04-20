namespace :fix_positions do
  desc "Fix positions data in QA by remapping old numeric codes"
  task qa: :environment do
    position_map = {
      '1' => 'P',
      '2' => 'C',
      '3' => '1B',
      '4' => '2B',
      '5' => '3B',
      '6' => 'SS',
      '7' => 'OF',
      '8' => 'OF',
      '9' => 'OF',
      'H' => 'DH',
      'D' => 'DH',
      'SP' => 'SP',
      'RP' => 'RP'
    }

    Player.find_each do |player|
      next if player.positions.blank? || player.positions.empty?

      # Map each position code to proper value
      fixed_positions = player.positions.flat_map do |pos|
        next if pos.blank?

        # Split the position string into individual characters
        pos.chars.map do |char|
          position_map[char] || position_map[char.upcase]
        end.compact
      end.compact.uniq

      # Only update if we found valid positions
      if fixed_positions.any?
        player.update_column(:positions, fixed_positions)
        puts "#{player.name}: #{player.positions.inspect} -> #{fixed_positions.inspect}"
      else
        puts "#{player.name}: No valid positions found in #{player.positions.inspect}"
      end
    end
  end
end
