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
      puts "✓ Updated password for: #{user.username} (#{user.name})"
    end

    puts "\n✅ All #{User.count} users now have password: '#{password}'"
    puts "\nUsers:"
    User.includes(:teams).all.each do |user|
      team_name = user.team&.name || 'No team'
      puts "  - #{user.username} (#{user.name}) - #{team_name}"
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
      puts "#{user.username.ljust(30)} | #{user.name.ljust(20)} | #{team_name.ljust(25)} #{owner_id} #{admin}"
    end
    puts "-" * 70
    puts "Total: #{User.count} users"
  end

  desc "Show current team ownership and notification emails"
  task show_team_owners: :environment do
    puts "\n📋 Current Team Ownership:"
    puts "-" * 80
    Team.includes(:owner, :team_emails).order(:name).all.each do |team|
      if team.owner
        puts "#{team.name.ljust(35)} → #{team.owner.name.ljust(25)} (@#{team.owner.username})"
        if team.team_emails.any?
          team.team_emails.each do |team_email|
            primary = team_email.primary? ? " [PRIMARY]" : ""
            notif = team_email.receive_trade_notifications? ? " [TRADE NOTIF]" : ""
            puts "   └─ #{team_email.email}#{primary}#{notif}"
          end
        else
          puts "   └─ ⚠️  No notification emails configured"
        end
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

  desc "Migrate team owner usernames to team_emails table"
  task migrate_team_emails: :environment do
    puts "\n📧 Migrating team owner emails to team_emails table..."

    migrated = 0
    skipped = 0

    Team.includes(:owner, :team_emails).all.each do |team|
      if team.owner.blank?
        puts "⚠️  Skipping #{team.name} - no owner assigned"
        skipped += 1
        next
      end

      # Check if email already exists for this team
      if team.team_emails.where(email: team.owner.username).exists?
        puts "⏭️  Skipping #{team.name} - email already exists"
        skipped += 1
        next
      end

      # Create team email from owner's username (which is actually an email)
      team_email = team.team_emails.create!(
        email: team.owner.username,
        primary: true,
        receive_trade_notifications: true
      )

      puts "✓ Created email for #{team.name}: #{team_email.email} [PRIMARY] [TRADE NOTIF]"
      migrated += 1
    end

    puts "\n✅ Migration complete!"
    puts "   Migrated: #{migrated} teams"
    puts "   Skipped: #{skipped} teams"

    puts "\n📋 Current team emails:"
    Team.includes(:owner, :team_emails).order(:name).each do |team|
      if team.team_emails.any?
        puts "#{team.name.ljust(35)} → #{team.team_emails.count} email(s)"
        team.team_emails.each do |email|
          flags = []
          flags << "PRIMARY" if email.primary?
          flags << "TRADE NOTIF" if email.receive_trade_notifications?
          puts "   └─ #{email.email} [#{flags.join(', ')}]"
        end
      else
        puts "#{team.name.ljust(35)} → ⚠️  No emails"
      end
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
