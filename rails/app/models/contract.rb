class Contract < ApplicationRecord
  belongs_to :team
  belongs_to :player
  belongs_to :winning_bid, foreign_key: :bid_id, class_name: 'Bid'

  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }

  # Update player's free agent status when contract changes
  after_save :update_player_free_agent_status, if: :affects_or_affected_current_season?
  after_destroy :update_player_free_agent_status, if: :affects_current_season?

  def update_player_free_agent_status
    player.update_free_agent_status! if player.present?
  end

  # Check if this contract affects the current season (after change)
  def affects_current_season?
    return false unless Season.current.present?

    current_season_id = Season.current.id

    # Check if contract covers current season (first_season <= current <= last_season)
    return false if first_season_id.nil? || last_season_id.nil?

    first_season_id <= current_season_id && last_season_id >= current_season_id && active?
  end

  # Check if this contract affects current season now OR before the change
  def affects_or_affected_current_season?
    return true if affects_current_season?

    # Check if it affected current season before the change
    return false unless Season.current.present?

    current_season_id = Season.current.id

    # Check previous values for active, first_season_id, or last_season_id
    if saved_change_to_active? || saved_change_to_first_season_id? || saved_change_to_last_season_id?
      old_active = saved_change_to_active? ? saved_change_to_active[0] : active
      old_first = saved_change_to_first_season_id? ? saved_change_to_first_season_id[0] : first_season_id
      old_last = saved_change_to_last_season_id? ? saved_change_to_last_season_id[0] : last_season_id

      return false if old_first.nil? || old_last.nil?

      # Did it cover current season before?
      return true if old_active && old_first <= current_season_id && old_last >= current_season_id
    end

    false
  end
  
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
          contract.first_season = bid.first_season
          contract.last_season = bid.last_season

          # Check if player had contract with this team that expired in the previous season
          previous_season = bid.first_season.previous_season
          had_expiring_contract = false

          if previous_season.present?
            had_expiring_contract = Contract.where(
              player_id: bid.player_id,
              team_id: bid.team_id,
              last_season_id: previous_season.id
            ).exists?
          end

          # Get league minimum for this contract length from free agency period
          minimum_annual = bid.free_agency_period.minimum_contract_amount_for_season_range(
            bid.first_season,
            bid.last_season
          )

          # Apply 15% home team discount if re-signing after contract expiration, but not below league minimum
          if had_expiring_contract
            discounted_amount = bid.annual_amount * 0.85
            contract.amount = [discounted_amount, minimum_annual].max
          else
            contract.amount = bid.annual_amount
          end

          contract.active = true
          contract.summer = false
          contract.franchise = false
          contract.winning_bid = bid
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
