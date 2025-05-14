class UserMailer < Devise::Mailer
    default from: "no-reply@billymartinplayersleague.com"

    def reset_password_instructions(record, token, opts={})
        super
    end
end