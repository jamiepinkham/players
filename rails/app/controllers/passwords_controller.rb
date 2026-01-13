class PasswordsController < Devise::PasswordsController
  respond_to :json
  skip_before_action :require_no_authentication, only: [:create]
  before_action :process_token, only: [:update]

  # PUT /resource/password
  def update
    # Handle password reset with token (from email link)
    if params[:user] && params[:user][:reset_password_token].present?
      super
    # Handle authenticated user changing their password
    elsif @current_user_id
      user = User.find(@current_user_id)
      password = params[:new_pass]
      if user.valid_password?(password)
        user.password = params[:new_pass]
        begin
          user.save
          render json: { status: "ok" }
        rescue
          render json: { errors: $!}
        end
      else
        render json: {errors: "invalid password" }
      end
    else
      render json: { errors: "Unauthorized" }, status: :unauthorized
    end
  end

  private
  def process_token
    if request.headers['Authorization'].present?
      begin
        jwt = request.headers['Authorization'].split(' ')[1].remove('"')
        jwt_secret = ENV['DEVISE_JWT_SECRET_KEY'] || Rails.application.secret_key_base
        jwt_payloads = JWT.decode(jwt, jwt_secret)
        jwt_payload = jwt_payloads.first
        @current_user_id = jwt_payload['sub']
      rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError
        head :unauthorized
      end
    end
  end
end