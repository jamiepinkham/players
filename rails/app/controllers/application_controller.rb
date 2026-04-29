class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :null_session
  respond_to :json

  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    # Permit username for sign in, sign up, and account update
    devise_parameter_sanitizer.permit(:sign_in, keys: [:username])
    devise_parameter_sanitizer.permit(:sign_up, keys: [:username, :name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:username, :name])
  end

  # Shared JWT authentication method
  # Returns the user if valid JWT is present, nil otherwise
  def current_user_from_jwt
    return @current_user if defined?(@current_user)

    Rails.logger.warn "=== JWT AUTH START for #{request.path} ==="
    @current_user = nil
    if request.headers['Authorization'].present?
      begin
        auth_header = request.headers['Authorization']
        Rails.logger.warn "Auth header first 30 chars: #{auth_header[0..29]}..."

        jwt = auth_header.split(' ')[1]
        Rails.logger.warn "JWT token extracted: #{jwt ? "yes (#{jwt.length} chars)" : 'NO TOKEN'}"

        jwt_secret = ENV['DEVISE_JWT_SECRET_KEY'] || Rails.application.secret_key_base
        Rails.logger.warn "About to decode JWT..."
        jwt_payloads = JWT.decode(jwt, jwt_secret)
        jwt_payload = jwt_payloads.first

        Rails.logger.warn "JWT decoded successfully, sub: #{jwt_payload['sub']}"

        @current_user = User.find_by(id: jwt_payload['sub'])
        Rails.logger.warn "User lookup result: #{@current_user ? "found user #{@current_user.id}" : 'NO USER FOUND IN DB'}"
      rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError => e
        Rails.logger.warn "JWT authentication failed: #{e.class} - #{e.message}"
        @current_user = nil
      rescue => e
        Rails.logger.error "Unexpected JWT error: #{e.class} - #{e.message}"
        Rails.logger.error e.backtrace.first(5).join("\n")
        @current_user = nil
      end
    else
      Rails.logger.warn "No Authorization header present for #{request.path}"
    end
    Rails.logger.warn "=== JWT AUTH END, user: #{@current_user&.id} ==="
    @current_user
  end

  # Before action helper that requires authentication
  # Renders error response if JWT is invalid or missing
  def authenticate_user_from_jwt!
    user = current_user_from_jwt
    unless user
      Rails.logger.warn "authenticate_user_from_jwt! failed for #{request.path} - no user found"
      Rails.logger.warn "Authorization header present: #{request.headers['Authorization'].present?}"
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end
end
