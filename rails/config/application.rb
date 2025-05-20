require_relative 'boot'

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
# require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
# require "action_mailbox/engine"
# require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
require "rails/test_unit/railtie"
# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module BmplFinances
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.
    Rails.application.routes.default_url_options[:host] = 'players.billymartinplayersleague.com'

    config.middleware.use ActionDispatch::Cookies
    config.middleware.use Rack::MethodOverride
    config.middleware.use ActionDispatch::Session::CookieStore, {}

    null_regex = Regexp.new(/\Anull\z/)
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        hostnames = [null_regex, 'localhost:5100', 'localhost:3000']
        hostnames += ENV['CORS_ORIGINS'].split(',') if ENV['CORS_ORIGINS']
        origins hostnames
        resource '*',
          headers: :any,
          methods: :any,
          expose: ['Content-Disposition'],
          credentials: true
      end
    end
    
  end
end
