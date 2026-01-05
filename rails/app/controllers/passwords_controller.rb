class PasswordsController < Devise::PasswordsController
  respond_to :json
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
        jwt_payloads = JWT.decode(jwt,
          'faba5c848cf90f9bd2d09dd996c76f0912cc775b1d1e460413fd235a0d7cd411f2f07352acd38408df14c7967fa3d893b8ac8d9b15b4f0860359b63847419c04')
        jwt_payload = jwt_payloads.first
        @current_user_id = jwt_payload['sub']
      rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError
        head :unauthorized
      end
    end
  end
end