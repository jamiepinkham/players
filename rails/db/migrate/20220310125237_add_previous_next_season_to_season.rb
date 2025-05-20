class AddPreviousNextSeasonToSeason < ActiveRecord::Migration[6.1]
  def change
    add_column :seasons, :previous_season_id, :bigint
    add_column :seasons, :next_season_id, :bigint
  end
end
