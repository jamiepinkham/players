class AddFreeAgentTrackingToPlayers < ActiveRecord::Migration[8.1]
  def up
    # Add is_free_agent column with index for efficient querying
    add_column :players, :is_free_agent, :boolean, default: false, null: false
    add_index :players, :is_free_agent

    # Note: Initial free agent status will be calculated by after_save callbacks
    # on existing contracts, or can be manually triggered with:
    # rake free_agents:update
  end

  def down
    remove_index :players, :is_free_agent
    remove_column :players, :is_free_agent
  end
end
