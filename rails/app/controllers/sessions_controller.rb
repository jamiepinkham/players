class SessionsController < Devise::SessionsController
    respond_to :json, :html

    def create
        # Handle JSON API requests
        if request.format.json?
            user = User.find_for_database_authentication(username: params[:user][:username])

            if user && user.valid_password?(params[:user][:password])
                self.resource = warden.authenticate!(auth_options)
                sign_in(resource_name, resource)
                render json: { jwt: current_token }
            else
                render json: {errors: "username/password not found"}
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
end


