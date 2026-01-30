class SessionsController < Devise::SessionsController
    respond_to :json, :html
    skip_before_action :verify_authenticity_token, if: :json_request?
    skip_before_action :require_no_authentication, only: [:create], if: :json_request?
    skip_before_action :verify_signed_out_user, only: [:destroy], if: :json_request?

    def create
        # Handle JSON API requests
        if request.format.json?
            user = User.find_for_database_authentication(username: params[:user][:username])

            if user && user.valid_password?(params[:user][:password])
                # Sign in the validated user directly instead of re-authenticating
                # This ensures the JWT token is generated for the correct user
                self.resource = user
                sign_in(resource_name, user)
                token = current_token

                if token.present?
                    render json: { jwt: token }
                else
                    render json: { errors: "Authentication failed" }, status: :unauthorized
                end
            else
                render json: {errors: "username/password not found"}, status: :unauthorized
            end
        else
            # Handle HTML form requests (for RailsAdmin)
            super
        end
    end

    private
    def respond_with(resource, opts = {})
        if request.format.json?
            render json: resource
        else
            super
        end
    end

    def current_token
        request.env['warden-jwt_auth.token']
    end

    def respond_to_on_destroy
        if request.format.json?
            render json: { status: "ok"}
        else
            super
        end
    end

    def json_request?
        request.format.json?
    end
end


