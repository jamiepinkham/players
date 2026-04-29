class AddFreeAgentTrackingToPlayers < ActiveRecord::Migration[8.1]
  def up
    # Add is_free_agent column with index for efficient querying
    add_column :players, :is_free_agent, :boolean, default: false, null: false
    add_index :players, :is_free_agent

    # Set correct free agent status for existing players
    # Players are free agents if they don't have an active contract in the current season
    execute <<-SQL
      UPDATE players
      SET is_free_agent = true
      WHERE id NOT IN (
        SELECT DISTINCT player_id
        FROM contracts
        WHERE active = true
          AND first_season_id <= (SELECT id FROM seasons WHERE is_active = true LIMIT 1)
          AND last_season_id >= (SELECT id FROM seasons WHERE is_active = true LIMIT 1)
      )
    SQL
  end

  def down
    remove_index :players, :is_free_agent
    remove_column :players, :is_free_agent
  end
end
