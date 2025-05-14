class CreateTrades < ActiveRecord::Migration[6.1]
  def change
    create_table :trades do |t|
      t.integer :from_team_id, null: false
      t.integer :to_team_id, null: false
      t.integer :from_cash_amount, default: 0, null: false
      t.integer :to_cash_amount, default: 0, null: false
      t.integer :status, default: 0, null: false
      t.string :note

      t.timestamps
    end
  end
end
