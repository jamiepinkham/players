class AdminRedirectController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :authenticate_user_from_token!

  def index
    # User is authenticated via JWT, now create a session for RailsAdmin
    if @current_user&.is_admin?
      Rails.logger.info "AdminRedirect: User #{@current_user.id} (#{@current_user.username}) is admin, creating session"

      # Sign in the user to create a session cookie
      # bypass: true avoids triggering JWT token generation
      sign_in(:user, @current_user, bypass: true, store: true)

      Rails.logger.info "AdminRedirect: Session created, user_id in session: #{session[:user_id] || warden.user(:user)&.id}"
      Rails.logger.info "AdminRedirect: Redirecting to RailsAdmin"

      # Redirect to RailsAdmin
      redirect_to rails_admin_path, allow_other_host: false
      return
    else
      Rails.logger.error "AdminRedirect: User #{@current_user&.id} is not an admin (is_admin: #{@current_user&.is_admin?})"
      render html: '<h1>Access Denied</h1><p>You must be an administrator to access this section.</p>'.html_safe, status: :forbidden
    end
  end

  private

  def authenticate_user_from_token!
    # Get token from query parameter or Authorization header
    token = params[:token] || request.headers['Authorization']&.split(' ')&.last

    Rails.logger.info "AdminRedirect: authenticate_user_from_token called"
    Rails.logger.info "AdminRedirect: Token present: #{token.present?}"

    unless token
      Rails.logger.error "AdminRedirect: No token provided"
      render html: '<h1>Authentication Required</h1><p>No authorization token provided.</p>'.html_safe, status: :unauthorized
      return
    end

    begin
      # Decode JWT token (using the same secret as Devise JWT)
      # The secret is configured in config/initializers/devise.rb
      jwt_secret = ENV['DEVISE_JWT_SECRET_KEY'] || Rails.application.secret_key_base
      jwt_payload = JWT.decode(
        token,
        jwt_secret,
        true,
        { algorithm: 'HS256' }
      ).first

      Rails.logger.info "AdminRedirect: JWT decoded successfully, sub: #{jwt_payload['sub']}, adm: #{jwt_payload['adm']}"

      # Find user by ID from token
      @current_user = User.find_by(id: jwt_payload['sub'])

      unless @current_user
        Rails.logger.error "AdminRedirect: User not found for ID: #{jwt_payload['sub']}"
        render html: '<h1>Invalid Token</h1><p>User not found.</p>'.html_safe, status: :unauthorized
        return
      end

      Rails.logger.info "AdminRedirect: User found: #{@current_user.username}, is_admin: #{@current_user.is_admin?}"
    rescue JWT::DecodeError, JWT::ExpiredSignature => e
      Rails.logger.error "AdminRedirect: JWT decode error: #{e.message}"
      render html: "<h1>Invalid Token</h1><p>Token error: #{e.message}</p>".html_safe, status: :unauthorized
      return
    end
  end
end
