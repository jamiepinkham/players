class RemoveOwnerIdFromTeams < ActiveRecord::Migration[6.1]
  def change
    remove_foreign_key :teams, column: :owner_id if foreign_key_exists?(:teams, column: :owner_id)
    remove_column :teams, :owner_id, :bigint
  end
end
