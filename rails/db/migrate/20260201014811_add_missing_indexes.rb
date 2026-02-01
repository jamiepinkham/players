class AddMissingIndexes < ActiveRecord::Migration[8.1]
  def change
    # Bids - Foreign keys
    add_index :bids, :player_id
    add_index :bids, :team_id

    # Bids - Composite indexes for common query patterns
    add_index :bids, [:free_agency_period_id, :team_id, :is_active], name: 'index_bids_on_period_team_active'
    add_index :bids, [:player_id, :is_active]

    # Trades - Foreign keys and status
    add_index :trades, :from_team_id
    add_index :trades, :to_team_id
    add_index :trades, :status
    add_index :trades, [:status, :from_team_id]
    add_index :trades, [:status, :to_team_id]

    # Contracts_Trades join table - clean up duplicates first
    # Remove duplicate entries keeping only the first one
    execute <<-SQL
      DELETE FROM contracts_trades
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM contracts_trades
        GROUP BY trade_id, contract_id
      )
    SQL

    add_index :contracts_trades, :contract_id
    add_index :contracts_trades, :trade_id
    add_index :contracts_trades, [:trade_id, :contract_id], unique: true

    # Boolean flag indexes for common lookups
    add_index :seasons, :is_active
    add_index :free_agency_periods, :is_active

    # JWT cleanup efficiency
    add_index :jwt_denylist, :exp
  end
end
