class CreateContracts < ActiveRecord::Migration[5.0]
  def change
    create_table :contracts do |t|
      t.decimal :amount
      t.integer :final_year
      t.references :team, index: true, foreign_key: true
      t.references :player, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
