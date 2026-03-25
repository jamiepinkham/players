class AddIsFreeAgentToPlayers < ActiveRecord::Migration[8.1]
  def up
    # Add column with default false
    add_column :players, :is_free_agent, :boolean, default: false, null: false
    add_index :players, :is_free_agent

    # Skip initial seeding - will be handled by free_agents:recalculate rake task
    # This avoids external API calls during migration which can timeout
    puts "Skipping initial free agent seeding - run 'rails free_agents:recalculate' after migration"
  end

  def down
    remove_index :players, :is_free_agent
    remove_column :players, :is_free_agent
  end
end
