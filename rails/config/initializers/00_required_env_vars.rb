# frozen_string_literal: true

# =================================================================
# Required Environment Variables Validator
# =================================================================
# This initializer runs BEFORE other initializers (00_ prefix)
# and validates that all required environment variables are set
# in production. This ensures fail-fast behavior on startup.
# =================================================================

if Rails.env.production?
  # Define required environment variables for production
  REQUIRED_ENV_VARS = [
    'SECRET_KEY_BASE',
    'DATABASE_HOST',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME'
  ].freeze

  # Check for missing or empty environment variables
  missing_vars = []
  invalid_vars = []

  REQUIRED_ENV_VARS.each do |var|
    value = ENV[var]

    if value.nil?
      missing_vars << var
    elsif value.strip.empty?
      invalid_vars << var
    elsif var == 'SECRET_KEY_BASE' && (value.include?('change') || value.include?('example') || value.length < 32)
      invalid_vars << "#{var} (appears to be a placeholder or too short)"
    elsif var.start_with?('DATABASE_') && (value.include?('your_') || value.include?('example'))
      invalid_vars << "#{var} (appears to be a placeholder)"
    end
  end

  # Fail fast if any required variables are missing or invalid
  if missing_vars.any? || invalid_vars.any?
    error_message = []
    error_message << "=" * 80
    error_message << "FATAL ERROR: Required environment variables are not properly configured"
    error_message << "=" * 80
    error_message << ""

    if missing_vars.any?
      error_message << "Missing required environment variables:"
      missing_vars.each { |var| error_message << "  ❌ #{var}" }
      error_message << ""
    end

    if invalid_vars.any?
      error_message << "Invalid or placeholder environment variables:"
      invalid_vars.each { |var| error_message << "  ⚠️  #{var}" }
      error_message << ""
    end

    error_message << "Please ensure all required environment variables are set before starting"
    error_message << "the application in production mode."
    error_message << ""
    error_message << "Required variables:"
    REQUIRED_ENV_VARS.each { |var| error_message << "  • #{var}" }
    error_message << ""
    error_message << "Copy .env.production.example to .env.production and update values:"
    error_message << "  $ cp .env.production.example .env.production"
    error_message << "  $ nano .env.production"
    error_message << ""
    error_message << "Generate SECRET_KEY_BASE with:"
    error_message << "  $ rails secret"
    error_message << "  # or"
    error_message << "  $ openssl rand -hex 64"
    error_message << ""
    error_message << "=" * 80

    # Print error message to STDERR
    $stderr.puts error_message.join("\n")

    # Exit with error code
    exit 1
  end

  # Log successful validation
  Rails.logger.info "✓ All required environment variables are configured"
  Rails.logger.info "✓ Running in RAILS_ENV=#{Rails.env}"
  Rails.logger.info "✓ Database: #{ENV['DATABASE_NAME']}@#{ENV['DATABASE_HOST']}"
end
