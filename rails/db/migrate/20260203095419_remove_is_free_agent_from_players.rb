class RemoveIsFreeAgentFromPlayers < ActiveRecord::Migration[8.1]
  def change
    remove_column :players, :is_free_agent, :boolean, default: false, null: false
  end
end
