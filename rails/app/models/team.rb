class Team < ApplicationRecord
  has_and_belongs_to_many :owners, class_name: 'User'
  has_many :contracts, -> { includes :player }
  has_many :bids, -> { includes :player }

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
