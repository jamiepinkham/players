namespace :data do
  desc 'Fix numerical position codes to proper abbreviations'
  task fix_positions: :environment do
    POSITION_MAP = {
      '1' => 'P',
      '2' => 'C',
      '3' => '1B',
      '4' => '2B',
      '5' => '3B',
      '6' => 'SS',
      '7' => 'LF',
      '8' => 'CF',
      '9' => 'RF'
    }

    def clean_position(position, position_map)
      return nil if position.blank?

      # Remove asterisks (batting side designation from FanGraphs)
      cleaned = position.gsub('*', '')

      # Replace numerical codes with abbreviations
      position_map.each do |num, abbrev|
        cleaned = cleaned.gsub(num, abbrev)
      end

      # Clean up known patterns
      # /HD or /DH -> /DH
      cleaned = cleaned.gsub('/HD', '/DH')

      # Remove trailing H or D letters (positional designations we don't need)
      cleaned = cleaned.gsub(/H+$/, '')  # Trailing H's
      cleaned = cleaned.gsub(/D+$/, '')  # Trailing D's unless part of DH
      cleaned = cleaned.gsub(/([^D])D([^H])/, '\1\2')  # D's not part of DH

      # Clean up multiple slashes
      cleaned = cleaned.gsub(/\/+/, '/')

      # Remove trailing slashes
      cleaned = cleaned.gsub(/\/$/, '')

      # If it's just "DH", keep it
      # If it ended up empty, return nil
      cleaned.blank? ? nil : cleaned
    end

    count = 0

    # Fix simple numerical codes
    Player.where("position IN ('1', '2', '3', '4', '5', '6', '7', '8', '9')").each do |player|
      old_pos = player.position
      new_pos = POSITION_MAP[old_pos]

      if new_pos
        player.update!(position: new_pos)
        puts "Updated #{player.name}: #{old_pos} -> #{new_pos}"
        count += 1
      end
    end

    # Fix complex position codes (with asterisks, slashes, letters)
    Player.where("position LIKE '%*%' OR position ~ '[0-9]'").each do |player|
      old_pos = player.position
      new_pos = clean_position(old_pos, POSITION_MAP)

      if new_pos && new_pos != old_pos
        player.update!(position: new_pos)
        puts "Updated #{player.name}: #{old_pos} -> #{new_pos}"
        count += 1
      end
    end

    puts ""
    puts "Updated #{count} players"
  end
end
