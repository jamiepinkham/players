class AddIndexesToPlayersAndContracts < ActiveRecord::Migration[6.1]
  def change
    # Add indexes for players table
    add_index :players, :bbrefid
    add_index :players, :position
    add_index :players, :name

    # Add indexes for contracts table to speed up active contract queries
    add_index :contracts, :active
    add_index :contracts, [:first_season_id, :last_season_id]
    add_index :contracts, [:player_id, :active]
  end
end
