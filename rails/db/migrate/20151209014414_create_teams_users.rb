class CreateTeamsUsers < ActiveRecord::Migration[5.0]
  def change
    create_table :teams_users, id: false do |t|
      t.integer :team_id, index: true
      t.integer :user_id, index: true
    end
  end
end
