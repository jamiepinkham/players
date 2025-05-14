class AddBbRefIdToPlayers < ActiveRecord::Migration[5.0]
  def change
    add_column :players, :bbrefid, :string
  end
end
