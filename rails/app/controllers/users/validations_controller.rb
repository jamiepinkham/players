module Users
  class ValidationsController < ApplicationController
    skip_before_action :verify_authenticity_token
    before_action :authenticate_user_from_jwt!

    def show
      # If we get here, the token is valid (authenticate_user_from_jwt! would have returned 401 otherwise)
      render json: {
        id: current_user_from_jwt.id,
        username: current_user_from_jwt.username,
        is_admin: current_user_from_jwt.is_admin?,
        team_id: current_user_from_jwt.team_id
      }, status: :ok
    end
  end
end
