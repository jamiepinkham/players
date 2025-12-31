# frozen_string_literal: true

# =================================================================
# Host Authorization Configuration
# =================================================================
# Configures which hostnames Rails will accept requests from.
# This prevents DNS rebinding attacks and ensures the app only
# responds to expected hostnames.
# =================================================================

Rails.application.configure do
  if Rails.env.production?
    # In production, only accept requests from explicitly allowed hosts
    # NO wildcards allowed - each hostname must be explicitly listed

    allowed_hosts = []

    # Primary application domain
    if ENV['APP_HOST'].present?
      allowed_hosts << ENV['APP_HOST']
    else
      # Default production hostname if APP_HOST not set
      allowed_hosts << 'players.billymartinplayersleague.com'
    end

    # Additional trusted hosts (comma-separated)
    if ENV['TRUSTED_HOSTS'].present?
      additional_hosts = ENV['TRUSTED_HOSTS'].split(',').map(&:strip).reject(&:empty?)
      allowed_hosts.concat(additional_hosts)
    end

    # Asset host (if different from app host)
    if ENV['ASSET_HOST'].present?
      asset_hostname = URI.parse(ENV['ASSET_HOST']).host rescue nil
      allowed_hosts << asset_hostname if asset_hostname
    end

    # Remove duplicates and nil values
    allowed_hosts.compact!
    allowed_hosts.uniq!

    # Validate no wildcards are used
    if allowed_hosts.any? { |host| host.include?('*') }
      Rails.logger.error "SECURITY ERROR: Wildcard hostnames are not allowed in production"
      Rails.logger.error "Rejected hosts: #{allowed_hosts.select { |h| h.include?('*') }.join(', ')}"
      raise "Host authorization error: Wildcards are not allowed in production"
    end

    # Configure allowed hosts
    config.hosts = allowed_hosts

    # Log configured hosts
    Rails.logger.info "=" * 80
    Rails.logger.info "Host Authorization Configured"
    Rails.logger.info "=" * 80
    Rails.logger.info "Allowed hosts:"
    allowed_hosts.each { |host| Rails.logger.info "  • #{host}" }
    Rails.logger.info "=" * 80

  elsif Rails.env.development?
    # In development, allow localhost and common development patterns
    config.hosts = [
      'localhost',
      '127.0.0.1',
      /.*\.local/,
      /.*\.localhost/,
      IPAddr.new('0.0.0.0/0'), # Allow all IPv4 (development only)
      IPAddr.new('::/0')        # Allow all IPv6 (development only)
    ]

  elsif Rails.env.test?
    # In test, allow common test hostnames
    config.hosts = [
      'localhost',
      '127.0.0.1',
      'example.com',
      'www.example.com',
      'test.host'
    ]
  end
end
