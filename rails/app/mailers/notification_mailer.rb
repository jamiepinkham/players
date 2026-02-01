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

    def bid_became_leading(bid)
        @bid = bid
        @player = bid.player
        @team = bid.team

        recipient_emails = get_team_emails(@team)
        return if recipient_emails.empty?

        subject = subject_with_env("Your bid for #{@player.name} is now leading!")

        mail(to: recipient_emails, subject: subject)
    end

    def bid_lost_leading_status(bid)
        @bid = bid
        @player = bid.player
        @team = bid.team

        recipient_emails = get_team_emails(@team)
        return if recipient_emails.empty?

        subject = subject_with_env("Your bid for #{@player.name} has been outbid")

        mail(to: recipient_emails, subject: subject)
    end

    def bid_converted_to_contract(contract)
        @contract = contract
        @player = contract.player
        @team = contract.team
        @bid = contract.winning_bid

        recipient_emails = get_team_emails(@team)
        return if recipient_emails.empty?

        subject = subject_with_env("Congratulations! You signed #{@player.name}")

        mail(to: recipient_emails, subject: subject)
    end

    private

    def get_team_emails(team)
        recipient_emails = team.notification_emails

        if recipient_emails.empty?
            fallback_emails = ENV.fetch('FALLBACK_NOTIFICATION_EMAILS', '').split(',').map(&:strip).reject(&:blank?)
            if fallback_emails.any?
                recipient_emails = fallback_emails
            else
                Rails.logger.warn("Notification for team #{team.id} skipped: no team emails or fallback emails configured")
            end
        end

        recipient_emails
    end

    def subject_with_env(subject)
        Rails.env.production? ? subject : "[TEST] #{subject} [TEST]"
    end
end
