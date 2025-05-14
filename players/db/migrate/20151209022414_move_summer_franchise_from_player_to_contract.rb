class MoveSummerFranchiseFromPlayerToContract < ActiveRecord::Migration[5.0]
  def change
    add_column :contracts, :summer, :boolean
    add_column :contracts, :franchise, :boolean

    Contract.all.each do |contract|
      contract.summer = contract.player.summer
      contract.franchise = contract.player.franchise
      contract.save
    end

    remove_column :players, :summer
    remove_column :players, :franchise
  end
end
