class AddOwnerToTeams < ActiveRecord::Migration[6.1]
  def up
    # Add owner_id column to teams
    add_reference :teams, :owner, foreign_key: { to_table: :users }, index: true

    # Migrate existing data from teams_users to teams.owner_id
    # Set the first user from teams_users as the owner
    # Only set owner_id if the user still exists (avoid orphaned foreign keys)
    execute <<-SQL
      UPDATE teams
      SET owner_id = (
        SELECT tu.user_id
        FROM teams_users tu
        INNER JOIN users u ON tu.user_id = u.id
        WHERE tu.team_id = teams.id
        LIMIT 1
      )
      WHERE EXISTS (
        SELECT 1
        FROM teams_users tu
        INNER JOIN users u ON tu.user_id = u.id
        WHERE tu.team_id = teams.id
      )
    SQL

    # Drop the teams_users join table since we no longer need it
    drop_table :teams_users
  end

  def down
    # Recreate teams_users table
    create_table :teams_users, id: false do |t|
      t.integer :team_id
      t.integer :user_id
    end

    add_index :teams_users, :team_id
    add_index :teams_users, :user_id

    # Migrate data back from owner_id to teams_users
    execute <<-SQL
      INSERT INTO teams_users (team_id, user_id)
      SELECT id, owner_id FROM teams WHERE owner_id IS NOT NULL
    SQL

    # Remove owner_id from teams
    remove_reference :teams, :owner, foreign_key: { to_table: :users }, index: true
  end
end
