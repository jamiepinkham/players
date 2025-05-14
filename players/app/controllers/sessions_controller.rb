class SessionsController < Devise::SessionsController
    respond_to :json

    def create
        user = User.find_by_email(params[:user][:email])
        if user && user.valid_password?(params[:user][:password])
            self.resource = warden.authenticate!(auth_options)
            sign_in(resource_name, resource)
            render json: { jwt: current_token }
        else
            render json: {errors: "username/password not found"}
        end
        
    end

    private
    def respond_with(resource, opts = {})
        render json: resource
    end
    def current_token
        request.env['warden-jwt_auth.token']
    end

    def respond_to_on_destroy
        render json: { status: "ok"}
    end
end


