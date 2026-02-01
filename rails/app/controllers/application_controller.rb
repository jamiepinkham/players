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

    @current_user = nil
    if request.headers['Authorization'].present?
      begin
        jwt = request.headers['Authorization'].split(' ')[1]
        jwt_secret = ENV['DEVISE_JWT_SECRET_KEY'] || Rails.application.secret_key_base
        jwt_payloads = JWT.decode(jwt, jwt_secret)
        jwt_payload = jwt_payloads.first
        @current_user = User.find_by(id: jwt_payload['sub'])
      rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError => e
        Rails.logger.debug { "JWT authentication failed: #{e.class}" } if Rails.env.development?
        @current_user = nil
      end
    end
    @current_user
  end

  # Before action helper that requires authentication
  # Renders error response if JWT is invalid or missing
  def authenticate_user_from_jwt!
    user = current_user_from_jwt
    unless user
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end
end
