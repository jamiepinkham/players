class Trade < ApplicationRecord
    has_many :contract_trades, dependent: :destroy
    has_many :contracts, through: :contract_trades
    belongs_to :from_team, class_name: 'Team'
    belongs_to :to_team, class_name: 'Team'

    validate :valid_trade_date
    # validate :valid_cash_amounts
    validate :valid_contracts
    validate :no_self_trading

    scope :pending, -> { where(status: :pending) }
    scope :accepted, -> { where(status: :accepted) }

    after_create :send_proposal_email

    enum :status, {
        pending: 0,
        accepted: 1,
        rejected: 2
    }, prefix: true

    def pending?
        status_pending?
    end

    def accept!
        contracts.each do |contract|
            contract.team_id = contract.team_id == from_team_id ? to_team_id : from_team_id
            # Summer draftee status is preserved through trades
            contract.save!
        end

        from_team.budget = from_team.budget + to_cash_amount - from_cash_amount
        to_team.budget = to_team.budget + from_cash_amount - to_cash_amount
        from_team.save!
        to_team.save!
        self.status_accepted!
    end

    def reject!
        self.status_rejected!
    end

    def from_contracts
        contracts.where(team_id: from_team.id)
    end

    def to_contracts
        contracts.where(team_id: to_team.id)
    end

    private
    def send_proposal_email
        NotificationMailer.trade_proposal(self).deliver_later
    end

    def valid_trade_date
        if !Rails.env.development? && Date.current.month >= 8 && Date.current.month <= 11
            errors.add(:created_at, "Trades cannot be done in August - November")
        end
    end

    def valid_cash_amounts
        if (from_cash_amount || 0) > from_team.available_cash
            errors.add(:from_cash_amount, "Initiating team does not have enough cash available")
        end
        if (to_cash_amount || 0) > to_team.available_cash
            errors.add(:to_cash_amount, "Target team does not have enough cash available")
        end
    end

    def valid_contracts
        # contracts need to be owned by from or to team
        contracts.each do |contract|
            if contract.team_id != to_team_id && contract.team_id != from_team_id
                errors.add(:contracts, "Cannot trade a contract neither team owns - #{contract.player.name}")
            end
            if contract.created_at > Time.current - 3.months && !contract.summer
                errors.add(:contracts, "Cannot trade a contract signed in the last 3 months - #{contract.player.name}")
            end
        end
    end

    def no_self_trading
        if from_team_id == to_team_id
            errors.add(:base, "Cannot trade with yourself")
        end
    end
end
