class CreatePlayers < ActiveRecord::Migration[5.0]
  def change
    create_table :players do |t|
      t.string :name
      t.string :position
      t.boolean :summer, :default => false
      t.boolean :franchise, :default => false
      t.integer :fangraphs_id
      t.string :type

      t.timestamps null: false
    end
  end
end
