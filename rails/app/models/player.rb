class Player < ApplicationRecord
  has_many :contracts
  has_many :player_stats
  has_one :contract, -> {
    current_season = Season.current
    where(active: true)
      .where('first_season_id <= ?', current_season&.id)
      .where('last_season_id >= ?', current_season&.id)
  }

  has_one :leading_bid, -> { where(is_leading: true) }, class_name: 'Bid'

  # Validation: cannot be free agent if has active contract
  validate :cannot_be_free_agent_with_contract

  # Returns players who either:
   # 1. Have stats for the current season (potentially eligible for FA), OR
   # 2. Have an active contract in the given season.
   scope :with_stats_or_current_contract, ->(season_id) {
     season = Season.find_by(id: season_id)
     return none unless season

     # Get player IDs with stats for the season
     player_ids_with_stats = PlayerStat.where(season: season)
       .where("stats IS NOT NULL AND stats != '{}'")
       .pluck(:player_id)

     # Get player IDs with active contracts
     player_ids_with_contracts = Contract
       .where(active: true)
       .where('first_season_id <= ?', season_id)
       .where('last_season_id >= ?', season_id)
       .pluck(:player_id)

     # Union of both sets
     all_player_ids = (player_ids_with_stats + player_ids_with_contracts).uniq

     where(id: all_player_ids).distinct
   }

  def is_trade_eligible?
    return self.contract.blank? || self.contract.summer || (self.contract.created_at < (Time.current - 3.months))
  end

  def trade_ineligibility_reason
    return nil if is_trade_eligible?

    if self.contract.present? && !self.contract.summer && self.contract.created_at >= (Time.current - 3.months)
      days_remaining = ((self.contract.created_at + 3.months) - Time.current).to_i / 1.day
      return "Signed within 3 months (#{days_remaining} days remaining)"
    end

    "Ineligible"
  end

  POSITIONS = ['SP', 'RP', 'C', '1B', '2B', '3B', 'SS', 'OF', 'DH']

  def to_s
    position.present? ? "#{name} (#{position})" : name
  end

  class << self

    def search_name(name)
      return all if name.blank?
      sanitized = sanitize_sql_like(name.downcase)
      Player.where("lower(name) LIKE ?", "%#{sanitized}%")
    end

    def lookup_by_position(position)
      # Handle outfielders - match LF, CF, or RF anywhere in position string
      if position == 'OF'
        return self.where("position LIKE ? OR position LIKE ? OR position LIKE ?", '%LF%', '%CF%', '%RF%')
      end

      # All other positions - match position text anywhere in string
      # This handles exact matches (position = "SS") and multi-position (position = "2B/SS")
      return self.where("position LIKE ?", "%#{position}%")
    end
  end

  def update_free_agent_status!
    # When contract is created/updated, set free agent to false if contract is active
    if contract.present?
      update_column(:is_free_agent, false) # Skip validations/callbacks
    end
    # When contract is destroyed, do nothing - leave flag unchanged
    # Admin must manually verify stats eligibility before setting to true
    # (See season switch rake tasks for stats verification implementation)
  end

  private

  def cannot_be_free_agent_with_contract
    return unless is_free_agent? && contract.present?

    errors.add(
      :is_free_agent,
      "cannot be set to true - player has active contract with #{contract.team.name} through #{contract.last_season.name}"
    )
  end

  # Check if player has stats in pybaseball for a given season's target year
  # This is the source of truth for eligibility
  def self.has_stats_in_pybaseball?(bbrefid, target_year, position)
    return false if bbrefid.blank? || target_year.blank?

    # Use PlayerStat as cache - if we have it, assume it came from pybaseball
    # For verification, could fetch from pybaseball directly but that's slow
    # The import process is responsible for ensuring PlayerStat matches pybaseball
    season = Season.find_by(target_stat_year: target_year)
    return false unless season

    player = Player.find_by(bbrefid: bbrefid)
    return false unless player

    player_stat = PlayerStat.find_by(player: player, season: season)
    return false unless player_stat&.stats&.present?

    stats = player_stat.stats

    # Check based on player position
    if position&.match?(/^(SP|RP)/)
      # Pitcher: must have IP > 0
      ip = stats['IP']&.to_f || 0
      ip > 0
    else
      # Position player: must have PA > 0
      pa = stats['PA']&.to_i || 0
      pa > 0
    end
  end

end
