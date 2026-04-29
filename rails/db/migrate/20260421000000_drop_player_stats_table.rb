class DropPlayerStatsTable < ActiveRecord::Migration[8.1]
  def up
    drop_table :player_stats, if_exists: true
  end

  def down
    # Recreating the table structure in case we need to rollback
    # Stats are now managed by the stats microservice
    create_table :player_stats do |t|
      t.references :player, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true
      t.jsonb :stats, null: false, default: {}
      t.timestamps

      t.index [:player_id, :season_id], unique: true
    end
  end
end
