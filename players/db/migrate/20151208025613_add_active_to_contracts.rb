class AddActiveToContracts < ActiveRecord::Migration[5.0]
  def change
    add_column :contracts, :active, :boolean, default: true
  end
end
