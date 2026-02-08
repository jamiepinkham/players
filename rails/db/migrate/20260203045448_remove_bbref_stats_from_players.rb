class RemoveBbrefStatsFromPlayers < ActiveRecord::Migration[8.1]
  def change
    remove_column :players, :bbref_stats, :jsonb
  end
end
