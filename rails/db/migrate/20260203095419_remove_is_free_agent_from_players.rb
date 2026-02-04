class RemoveIsFreeAgentFromPlayers < ActiveRecord::Migration[8.1]
  def change
    # Only remove if column exists (may not exist in all environments)
    if column_exists?(:players, :is_free_agent)
      remove_column :players, :is_free_agent, :boolean, default: false, null: false
    end
  end
end
