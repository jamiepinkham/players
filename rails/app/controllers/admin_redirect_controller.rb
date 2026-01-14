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
    Rails.logger.info "AdminRedirect: authenticate_user_from_token called"

    # If token is in query param, temporarily set it in Authorization header
    if params[:token].present?
      Rails.logger.info "AdminRedirect: Token from query param"
      request.headers['Authorization'] = "Bearer #{params[:token]}"
    end

    Rails.logger.info "AdminRedirect: Token present: #{request.headers['Authorization'].present?}"

    # Use shared JWT authentication from ApplicationController
    @current_user = current_user_from_jwt

    unless @current_user
      Rails.logger.error "AdminRedirect: Authentication failed - no valid user"
      render html: '<h1>Authentication Required</h1><p>Invalid or missing authorization token.</p>'.html_safe, status: :unauthorized
      return
    end

    Rails.logger.info "AdminRedirect: User found: #{@current_user.username}, is_admin: #{@current_user.is_admin?}"
  end
end
