class ChangePositionToPositionsArray < ActiveRecord::Migration[8.1]
  def up
    # Add new positions column as text array
    add_column :players, :positions, :text, array: true, default: []

    # Migrate existing position data
    # Old position column used numeric codes: 1=P, 2=C, 3=1B, 4=2B, 5=3B, 6=SS, 7/8/9=OF, H/D=DH
    position_map = {
      '1' => 'P', '2' => 'C', '3' => '1B', '4' => '2B', '5' => '3B', '6' => 'SS',
      '7' => 'OF', '8' => 'OF', '9' => 'OF', 'H' => 'DH', 'D' => 'DH',
      'LF' => 'OF', 'CF' => 'OF', 'RF' => 'OF'
    }

    Player.find_each do |player|
      next if player.position.blank?

      positions = []

      # Handle SP and RP as complete strings
      if player.position == 'SP'
        positions = ['SP']
      elsif player.position == 'RP'
        positions = ['RP']
      else
        # Split position string into individual characters and map them
        player.position.each_char do |char|
          mapped = position_map[char] || position_map[char.upcase]
          positions << mapped if mapped
        end
        positions.uniq!
      end

      player.update_column(:positions, positions) if positions.any?
    end

    # Remove old position column and its index
    remove_index :players, :position
    remove_column :players, :position

    # Add GIN index for efficient array queries
    add_index :players, :positions, using: :gin
  end

  def down
    # Add back position string column
    add_column :players, :position, :string
    add_index :players, :position

    # Migrate positions array back to string
    Player.find_each do |player|
      next if player.positions.blank?

      # Join positions with "/" (e.g., ["SS", "3B"] becomes "SS/3B")
      player.update_column(:position, player.positions.join('/'))
    end

    # Remove positions column and index
    remove_index :players, :positions
    remove_column :players, :positions
  end
end
