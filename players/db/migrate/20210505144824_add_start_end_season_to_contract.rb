class AddStartEndSeasonToContract < ActiveRecord::Migration[5.0]
  def change
    add_reference :contracts, :season_start, references: :seasons, index: true
    add_reference :contracts, :season_end, references: :seasons, index: true
  end
end
