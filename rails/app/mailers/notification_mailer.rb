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

    def trade_accepted(trade)
        @trade = trade

        # Notify both teams that the trade was accepted
        from_team_emails = get_team_emails(@trade.from_team)
        to_team_emails = get_team_emails(@trade.to_team)

        all_emails = (from_team_emails + to_team_emails).uniq
        return if all_emails.empty?

        subject = subject_with_env("Trade Accepted: #{@trade.from_team.name} ⇄ #{@trade.to_team.name}")

        mail(to: all_emails, subject: subject)
    end

    def trade_rejected(trade)
        @trade = trade

        # Only notify the team that proposed the trade
        recipient_emails = get_team_emails(@trade.from_team)
        return if recipient_emails.empty?

        subject = subject_with_env("Trade Rejected by #{@trade.to_team.name}")

        mail(to: recipient_emails, subject: subject)
    end

    def bid_conversion_summary(results, season_name, fa_active)
        @results = results
        @season_name = season_name
        @fa_active = fa_active

        admin_emails = ENV.fetch('FALLBACK_NOTIFICATION_EMAILS', '').split(',').map(&:strip).reject(&:blank?)
        return if admin_emails.empty?

        subject = subject_with_env("Bid Conversion Job Summary - #{season_name}")

        mail(to: admin_emails, subject: subject)
    end

    def bid_conversion_alert(active_bid_count, leading_bid_count, season_name)
        @active_bid_count = active_bid_count
        @leading_bid_count = leading_bid_count
        @season_name = season_name

        admin_emails = ENV.fetch('FALLBACK_NOTIFICATION_EMAILS', '').split(',').map(&:strip).reject(&:blank?)
        return if admin_emails.empty?

        subject = subject_with_env("ALERT: Bids found during inactive FA - #{season_name}")

        mail(to: admin_emails, subject: subject)
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
