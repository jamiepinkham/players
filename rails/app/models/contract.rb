class Contract < ApplicationRecord
  belongs_to :team
  belongs_to :player
  belongs_to :winning_bid, foreign_key: :bid_id, class_name: 'Bid'

  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }
  
  belongs_to :first_season, foreign_key: :first_season_id, class_name: 'Season'
  belongs_to :last_season, foreign_key: :last_season_id, class_name: 'Season'

  has_many :contract_trades, dependent: :destroy
  has_many :trades, through: :contract_trades

  def first_season_with_fallback
    first_season || Season.order(:id).first
  end

  def last_season_with_fallback
    last_season || Season.order(:id).first
  end

  def self.search(search)
    team_ids = Team.search(search).pluck(:id)
    player_ids = Player.search_name(search).pluck(:id)
    Contract.where(team_id: team_ids).or(Contract.where(player_id: player_ids))
  end

  class << self
      def contract_from_bid(bid)
          contract = Contract.new
          contract.player_id = bid.player_id
          contract.team_id = bid.team_id
          contract.amount = bid.annual_amount
          contract.active = true
          contract.summer = false
          contract.franchise = false
          contract.winning_bid = bid
          contract.first_season = bid.first_season
          contract.last_season = bid.last_season
          contract.save!
          bid.contract = contract
          bid.save(:validate => false)
          return contract
      end
  end

  def to_s
    "#{player&.name || 'Unknown Player'} - #{team&.name || 'Unknown Team'}#{' (inactive)' unless active}"
  end

  def rails_admin_label
    to_s
  end
end
