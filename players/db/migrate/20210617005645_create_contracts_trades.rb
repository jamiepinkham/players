class CreateContractsTrades < ActiveRecord::Migration[6.1]
  def change
    create_table :contracts_trades do |t|
      t.integer :contract_id
      t.integer :trade_id
      t.timestamps
    end
  end
end
