class NotificationMailer < ApplicationMailer
    default from: ENV.fetch('NOTIFICATION_FROM_EMAIL', 'no-reply@billymartinplayersleague.com')
    layout 'mailer'

    def trade_proposal(trade)
        @trade = trade

        # Get all emails for the receiving team that want trade notifications
        recipient_emails = trade.to_team.notification_emails

        # Fallback to configured admin emails if no team emails configured
        if recipient_emails.empty?
            fallback_emails = ENV.fetch('FALLBACK_NOTIFICATION_EMAILS', '').split(',').map(&:strip).reject(&:blank?)
            if fallback_emails.any?
                recipient_emails = fallback_emails
            else
                Rails.logger.warn("Trade #{trade.id} notification skipped: no team emails or fallback emails configured")
                return
            end
        end

        subject = if Rails.env.production?
            'You received a BMPL Trade Proposal'
        else
            '[TEST] You received a BMPL Trade Proposal [TEST]'
        end

        mail(to: recipient_emails, subject: subject)
    end
end
