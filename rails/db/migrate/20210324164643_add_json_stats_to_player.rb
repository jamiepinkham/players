class AddJsonStatsToPlayer < ActiveRecord::Migration[5.0]
  def change
    add_column :players, :bbref_stats, :json
    remove_column :players, :mlb_id, :string
    remove_column :players, :fangraphs_id, :string
    remove_column :players, :type, :string
  end
end
