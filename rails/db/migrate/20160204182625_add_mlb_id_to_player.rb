class AddMlbIdToPlayer < ActiveRecord::Migration[5.0]
  def change
      add_column :players, :mlb_id, :integer
  end
end
