class AddSeasonStartEndToBid < ActiveRecord::Migration[5.0]
  def change
    add_reference :bids, :first_season, references: :seasons, index: true
    add_reference :bids, :last_season, references: :seasons, index: true

    rename_column :contracts, :season_start_id, :first_season_id
    rename_column :contracts, :season_end_id, :last_season_id
  end
end
