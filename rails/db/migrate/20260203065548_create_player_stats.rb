class CreatePlayerStats < ActiveRecord::Migration[8.1]
  def change
    create_table :player_stats do |t|
      t.references :player, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true
      t.jsonb :stats, null: false, default: {}

      t.timestamps
    end

    # Ensure each player has only one stat record per season
    add_index :player_stats, [:player_id, :season_id], unique: true

    # Index for querying stats JSONB
    add_index :player_stats, :stats, using: :gin
  end
end
