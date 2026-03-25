class ChangePositionToPositionsArray < ActiveRecord::Migration[8.1]
  def up
    # Add new positions column as text array
    add_column :players, :positions, :text, array: true, default: []

    # Migrate existing position data
    Player.find_each do |player|
      next if player.position.blank?

      # Split position string by "/" to handle multi-position players
      position_parts = player.position.split('/')

      # Map each part to the standardized position
      positions = position_parts.map do |pos|
        pos = pos.strip

        # Convert specific outfield positions to generic OF
        if ['LF', 'CF', 'RF'].include?(pos)
          'OF'
        else
          pos
        end
      end.uniq # Remove duplicates (e.g., if someone had "LF/CF" both become "OF")

      player.update_column(:positions, positions)
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
