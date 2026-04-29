class AddTargetStatYearToSeasons < ActiveRecord::Migration[8.1]
  def change
    add_column :seasons, :target_stat_year, :integer

    # Set target_stat_year for existing seasons (BMPL year - 1)
    # Example: BMPL 2026 needs 2025 stats
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE seasons
          SET target_stat_year = CAST(SUBSTRING(name FROM '\\d{4}') AS INTEGER) - 1
          WHERE name ~ 'BMPL \\d{4}'
        SQL
      end
    end
  end
end
