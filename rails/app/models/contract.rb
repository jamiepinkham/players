class Contract < ApplicationRecord
  belongs_to :team
  belongs_to :player
  belongs_to :winning_bid, foreign_key: :bid_id, class_name: 'Bid'

  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }
  
  belongs_to :first_season, foreign_key: :first_season_id, class_name: 'Season'
  belongs_to :last_season, foreign_key: :last_season_id, class_name: 'Season'

  has_and_belongs_to_many :trades

  def first_season_with_fallback
    first_season || Season.order(:id).first
  end

  def last_season_with_fallback
    last_season || Season.order(:id).first
  end

  def self.search(search)
    teams = Team.search(search)
    players = Player.search(search)
    Contract.where("team_id in (?) or player_id in (?)", (teams || []).collect{|t| t.id}, (players || []).collect{|p| p.id})
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
end
