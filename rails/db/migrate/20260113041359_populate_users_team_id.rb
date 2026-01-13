class PopulateUsersTeamId < ActiveRecord::Migration[6.1]
  def up
    # For each team, set the owner's team_id to that team
    execute <<-SQL
      UPDATE users
      SET team_id = teams.id
      FROM teams
      WHERE teams.owner_id = users.id
    SQL

    # Find and log any users who own multiple teams
    multi_team_users = execute(<<-SQL).to_a
      SELECT users.id, users.username, COUNT(teams.id) as team_count
      FROM users
      INNER JOIN teams ON teams.owner_id = users.id
      GROUP BY users.id, users.username
      HAVING COUNT(teams.id) > 1
    SQL

    multi_team_users.each do |row|
      # Get the first team for this user
      first_team = execute(<<-SQL).first
        SELECT id, name
        FROM teams
        WHERE owner_id = #{row['id']}
        ORDER BY created_at
        LIMIT 1
      SQL

      if first_team
        puts "WARNING: User #{row['username']} owns #{row['team_count']} teams. Assigning to: #{first_team['name']}"
        execute("UPDATE users SET team_id = #{first_team['id']} WHERE id = #{row['id']}")
      end
    end
  end

  def down
    execute "UPDATE users SET team_id = NULL"
  end
end
