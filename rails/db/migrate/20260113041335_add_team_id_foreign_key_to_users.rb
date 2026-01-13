class AddTeamIdForeignKeyToUsers < ActiveRecord::Migration[6.1]
  def change
    add_foreign_key :users, :teams, column: :team_id, on_delete: :nullify
    add_index :users, :team_id unless index_exists?(:users, :team_id)
  end
end
