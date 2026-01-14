class NotificationMailer < ApplicationMailer
    default from: "no-reply@billymartinplayersleague.com"
    layout 'mailer'

    def trade_proposal(trade)
        @trade = trade

        # Get all emails for the receiving team that want trade notifications
        recipient_emails = trade.to_team.notification_emails

        # Fallback to test emails if no team emails configured
        if recipient_emails.empty?
            recipient_emails = ["jamie@cellardoorsoftware.com", "mike@cellardoorsoftware.com"]
        end

        subject = if Rails.env.production?
            'You received a BMPL Trade Proposal'
        else
            '[TEST] You received a BMPL Trade Proposal [TEST]'
        end

        mail(to: recipient_emails, subject: subject)
    end
end
