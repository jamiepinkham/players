namespace :dev do
  desc "Reset all user passwords to 'password' for local development"
  task reset_passwords: :environment do
    if Rails.env.production?
      puts "❌ Cannot run this task in production!"
      exit 1
    end

    password = ENV['PASSWORD'] || 'password'

    User.all.each do |user|
      user.password = password
      user.password_confirmation = password
      user.save(validate: false)
      puts "✓ Updated password for: #{user.email} (#{user.name})"
    end

    puts "\n✅ All #{User.count} users now have password: '#{password}'"
    puts "\nUsers:"
    User.includes(:teams).all.each do |user|
      team_name = user.team&.name || 'No team'
      puts "  - #{user.email} (#{user.name}) - #{team_name}"
    end
  end

  desc "List all users with their teams"
  task list_users: :environment do
    puts "\n📋 Users in database:"
    puts "-" * 70
    User.includes(:teams).all.each do |user|
      team_name = user.team&.name || 'No team (NOT OWNER OF ANY TEAM)'
      admin = user.is_admin? ? '[ADMIN]' : ''
      owner_id = user.team&.owner_id == user.id ? '✓ Owner' : '✗ Not Owner'
      puts "#{user.email.ljust(30)} | #{user.name.ljust(20)} | #{team_name.ljust(25)} #{owner_id} #{admin}"
    end
    puts "-" * 70
    puts "Total: #{User.count} users"
  end

  desc "Show current team ownership (DO NOT USE assign_team_owners - it overwrites correct data!)"
  task show_team_owners: :environment do
    puts "\n📋 Current Team Ownership:"
    puts "-" * 80
    Team.includes(:owner).order(:name).all.each do |team|
      if team.owner
        puts "#{team.name.ljust(35)} → #{team.owner.name.ljust(25)} (#{team.owner.email})"
      else
        puts "#{team.name.ljust(35)} → ⚠️  NO OWNER ASSIGNED"
      end
    end
    puts "-" * 80
    puts "Total: #{Team.count} teams"

    unowned_teams = Team.where(owner_id: nil).count
    if unowned_teams > 0
      puts "\n⚠️  Warning: #{unowned_teams} teams have no owner"
    end
  end

  desc "Age all contracts to make them trade eligible (> 3 months old)"
  task age_contracts: :environment do
    if Rails.env.production?
      puts "❌ Cannot run this task in production!"
      exit 1
    end

    months_ago = ENV['MONTHS'].present? ? ENV['MONTHS'].to_i : 4
    target_date = Time.now - months_ago.months

    Contract.all.each do |contract|
      if contract.created_at > target_date
        contract.update_column(:created_at, target_date)
        puts "✓ Aged contract for #{contract.player.name} on #{contract.team.name} to #{months_ago} months ago"
      end
    end

    puts "\n✅ All contracts are now #{months_ago}+ months old and trade eligible"
    puts "\nTrade eligible contracts:"
    Contract.includes(player: [], team: []).all.each do |contract|
      eligible = contract.player.is_trade_eligible? ? '✓' : '✗'
      puts "  #{eligible} #{contract.player.name.ljust(25)} | #{contract.team.name.ljust(20)} | Created: #{contract.created_at.strftime('%Y-%m-%d')}"
    end
  end
end
