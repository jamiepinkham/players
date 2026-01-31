class UserMailer < Devise::Mailer
    default from: "no-reply@billymartinplayersleague.com"

    def reset_password_instructions(record, token, opts={})
        @token = token
        @resource = record

        # Get the email address to send to (from opts or default)
        @email = opts[:to] || record.email

        devise_mail(record, :reset_password_instructions, opts.merge(to: @email))
    end
end