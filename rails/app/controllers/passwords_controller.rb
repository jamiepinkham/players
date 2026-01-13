class PasswordsController < Devise::PasswordsController
  respond_to :json
  skip_before_action :require_no_authentication, only: [:create, :update]
  skip_before_action :verify_authenticity_token, only: [:create, :update]
  before_action :process_token, only: [:update]

  # POST /resource/password
  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)

    if successfully_sent?(resource)
      render json: { message: "Reset instructions sent successfully" }, status: :ok
    else
      render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PUT /resource/password
  def update
    # Handle password reset with token (from email link)
    if params[:user] && params[:user][:reset_password_token].present?
      self.resource = resource_class.reset_password_by_token(resource_params)

      if resource.errors.empty?
        resource.unlock_access! if unlockable?(resource)
        render json: { message: "Password successfully updated" }, status: :ok
      else
        render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
      end
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
    # Use shared JWT authentication from ApplicationController
    user = current_user_from_jwt
    @current_user_id = user&.id
  end
end