class CreateTeams < ActiveRecord::Migration[5.0]
  def change
    create_table :teams do |t|
      t.string :name
      t.decimal :budget
      t.string :stadium

      t.timestamps null: false
    end
  end
end
