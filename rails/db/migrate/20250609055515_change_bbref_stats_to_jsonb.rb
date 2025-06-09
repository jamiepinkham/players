class ChangeBbrefStatsToJsonb < ActiveRecord::Migration[6.1]
  def change
    change_column :players, :bbref_stats, :jsonb, using: 'bbref_stats::jsonb'
  end
end
