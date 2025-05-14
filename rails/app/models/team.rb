class Team < ApplicationRecord
  has_and_belongs_to_many :owners, class_name: 'User'
  has_many :contracts, -> { includes :player }
  has_many :bids, -> { includes :player }

  def current_payroll
    current_contracts.filter { |c| c.active }.collect{|c| c.amount}.inject(:+) || 0
  end

  def current_contracts
    contracts.filter { |c| c.last_season.end_date > Season.current.start_date }
  end

  def available_cash
    self.budget - self.current_payroll
  end

  def total_players
    current_contracts.count
  end

  def unsalaried_players
    current_contracts.filter { |c| !c.active }.count
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
