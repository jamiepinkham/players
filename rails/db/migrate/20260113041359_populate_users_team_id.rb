class PopulateUsersTeamId < ActiveRecord::Migration[6.1]
  def up
    # For each team, set the owner's team_id to that team
    Team.where.not(owner_id: nil).find_each do |team|
      User.where(id: team.owner_id).update_all(team_id: team.id)
    end

    # Log any users who own multiple teams (we'll use their first team)
    User.joins(:teams).group('users.id').having('COUNT(teams.id) > 1').each do |user|
      first_team = user.teams.order(:created_at).first
      puts "WARNING: User #{user.username} owns multiple teams. Assigning to: #{first_team.name}"
      user.update_column(:team_id, first_team.id)
    end
  end

  def down
    User.update_all(team_id: nil)
  end
end
