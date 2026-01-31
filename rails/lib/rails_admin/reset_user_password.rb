module RailsAdmin
  module Config
    module Actions
      class ResetUserPassword < RailsAdmin::Config::Actions::Base
        # This is a member action (operates on individual user records)
        register_instance_option :member do
          true
        end

        register_instance_option :visible? do
          authorized?
        end

        register_instance_option :http_methods do
          [:get, :post]
        end

        register_instance_option :link_icon do
          'icon-lock'
        end

        register_instance_option :label do
          'Reset Password'
        end

        register_instance_option :controller do
          proc do
            @object = @abstract_model.model.find(params[:id])

            if request.get?
              # Render the form (view template will be loaded automatically)
              render @action.template_name
            elsif request.post?
              # Process the password reset
              password = params[:password]
              password_confirmation = params[:password_confirmation]

              # Validate password presence
              if password.blank?
                flash[:error] = "Password cannot be blank"
                redirect_to back_or_index
                return
              end

              # Validate password confirmation
              if password != password_confirmation
                flash[:error] = "Password and confirmation do not match"
                redirect_to back_or_index
                return
              end

              # Validate password length (Devise default: 8-72 characters)
              if password.length < 8
                flash[:error] = "Password must be at least 8 characters"
                redirect_to back_or_index
                return
              end

              if password.length > 72
                flash[:error] = "Password must be less than 72 characters"
                redirect_to back_or_index
                return
              end

              begin
                # Use Devise's password setter which handles encryption
                @object.password = password
                @object.password_confirmation = password_confirmation

                if @object.save
                  flash[:success] = "Password successfully reset for #{@object.username}. New password: #{password}"
                  flash[:notice] = "Please securely communicate this password to the user. It will only be displayed once."
                  redirect_to back_or_index
                else
                  # If Devise validation fails, show the errors
                  flash[:error] = "Failed to reset password: #{@object.errors.full_messages.join(', ')}"
                  redirect_to back_or_index
                end
              rescue => e
                flash[:error] = "Failed to reset password: #{e.message}"
                redirect_to back_or_index
              end
            end
          end
        end
      end
    end
  end
end
