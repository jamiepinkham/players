class CreateBids < ActiveRecord::Migration[5.0]
  def change
    create_table :bids do |t|
      t.references :player
      t.references :team
      t.integer :number_of_years
      t.decimal :annual_amount

      t.timestamps null: false
    end
  end
end
