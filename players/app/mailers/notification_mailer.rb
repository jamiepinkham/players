class NotificationMailer < ApplicationMailer
    default from: "no-reply@billymartinplayersleague.com"
    layout 'mailer'

    def trade_proposal(trade)
        @trade = trade
        if Rails.env.production?
            mail(to: trade.to_team.owners.collect{|u| u.email}, subject: 'You received a BMPL Trade Proposal')
        else
            mail(to: ["jamie@cellardoorsoftware.com", "mike@cellardoorsoftware.com"], subject: '[TEST] You received a BMPL Trade Proposal [TEST]')
        end
    end
end
