class Team < ApplicationRecord
  has_one :user
  has_many :contracts, -> { includes :player }
  has_many :bids, -> { includes :player }
  has_many :team_emails, dependent: :destroy

  def to_s
    name || "Team ##{id}"
  end

  def rails_admin_label
    to_s
  end

  # Get all email addresses for trade notifications
  def notification_emails
    team_emails.for_trade_notifications.pluck(:email)
  end

  # Get primary email or first available email
  def primary_email
    team_emails.primary.first&.email || team_emails.first&.email
  end

  def current_payroll
    current_season = Season.current
    return 0 unless current_season

    contracts
      .where('first_season_id <= ? AND last_season_id >= ?', current_season.id, current_season.id)
      .where(active: true)
      .sum(:amount)
  end

  def current_contracts
    current_season = Season.current
    return Contract.none unless current_season

    contracts
      .where('first_season_id <= ? AND last_season_id >= ?', current_season.id, current_season.id)
  end

  def available_cash
    self.budget - self.current_payroll
  end

  def total_players
    current_season = Season.current
    return 0 unless current_season

    contracts
      .where('first_season_id <= ? AND last_season_id >= ?', current_season.id, current_season.id)
      .count
  end

  def unsalaried_players
    current_season = Season.current
    return 0 unless current_season

    contracts
      .where('first_season_id <= ? AND last_season_id >= ?', current_season.id, current_season.id)
      .where(active: false)
      .count
  end

  def available_bids
    Bid::MAX_TEAM_BIDS - self.active_bids.count
  end

  def active_bids
    Bid.active.where(team_id: self.id)
  end

  def self.search(search)
    where("name ILIKE ?", "%#{search}%")
  end

  def pending_trades
    Trade.pending.where('from_team_id = ? OR to_team_id = ?', self.id, self.id)
  end
end
