Rails.application.configure do
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true

  config.action_mailer.smtp_settings = {
    address: ENV['MAILGUN_SMTP_ADDRESS'],
    port: ENV['MAILGUN_SMTP_PORT']&.to_i || 587,
    domain: ENV['MAILGUN_SMTP_DOMAIN'],
    user_name: ENV['MAILGUN_SMTP_USERNAME'],
    password: ENV['MAILGUN_SMTP_PASSWORD'],
    authentication: ENV['MAILGUN_SMTP_AUTHENTICATION']&.to_sym || :plain,
    enable_starttls_auto: true
  }

  config.action_mailer.default_options = {
    from: ENV['MAILER_FROM'] || 'no-reply@billymartinplayersleague.com'
  }
end
