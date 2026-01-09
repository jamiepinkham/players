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
    puts "-" * 60
    User.includes(:teams).all.each do |user|
      team_name = user.team&.name || 'No team'
      admin = user.is_admin? ? '[ADMIN]' : ''
      puts "#{user.email.ljust(30)} | #{user.name.ljust(20)} | #{team_name} #{admin}"
    end
    puts "-" * 60
    puts "Total: #{User.count} users"
  end
end
