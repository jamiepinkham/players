class UsernamesController < ApplicationController
  respond_to :json
  before_action :authenticate_user_from_jwt!

  # PUT /users/username
  def update
    @current_user = current_user_from_jwt

    new_username = params[:username]

    if new_username.blank?
      render json: { error: "Username cannot be blank" }, status: :unprocessable_entity
      return
    end

    # Validate username format
    unless new_username.match?(/\A[a-zA-Z0-9_.]+\z/)
      render json: { error: "Username can only contain letters, numbers, underscores and periods" }, status: :unprocessable_entity
      return
    end

    # Check if username already taken
    if User.where.not(id: @current_user.id).exists?(username: new_username)
      render json: { error: "Username is already taken" }, status: :unprocessable_entity
      return
    end

    @current_user.username = new_username

    if @current_user.save
      render json: { success: true, username: @current_user.username }
    else
      render json: { error: @current_user.errors.full_messages.join(", ") }, status: :unprocessable_entity
    end
  end
end
