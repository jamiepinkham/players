class Player < ApplicationRecord
  has_many :contracts
  has_one :contract, -> {
    current_season = Season.current
    where(active: true)
      .where('first_season_id <= ?', current_season&.id)
      .where('last_season_id >= ?', current_season&.id)
  }

  has_one :leading_bid, -> { where(is_leading: true) }, class_name: 'Bid'

  # Position constants
  POSITIONS = ['SP', 'RP', 'C', '1B', '2B', '3B', 'SS', 'OF', 'DH'].freeze

  # Validations
  validate :cannot_be_free_agent_with_contract
  validate :validate_positions

  # Ensure positions is always an array
  before_validation :ensure_positions_is_array

  # Returns players who either:
   # 1. Have a bbrefid (potentially eligible for FA based on stats), OR
   # 2. Have an active contract in the given season.
   scope :with_stats_or_current_contract, ->(season_id) {
     season = Season.find_by(id: season_id)
     return none unless season

     # Get player IDs with bbrefid (can fetch stats on-demand)
     player_ids_with_bbrefid = where.not(bbrefid: [nil, '']).pluck(:id)

     # Get player IDs with active contracts
     player_ids_with_contracts = Contract
       .where(active: true)
       .where('first_season_id <= ?', season_id)
       .where('last_season_id >= ?', season_id)
       .pluck(:player_id)

     # Union of both sets
     all_player_ids = (player_ids_with_bbrefid + player_ids_with_contracts).uniq

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

  def to_s
    positions.present? ? "#{name} (#{positions.join(', ')})" : name
  end

  # Check if player is eligible for a specific position
  def eligible_for_position?(position)
    positions&.include?(position)
  end

  class << self

    def search_name(name)
      return all if name.blank?
      sanitized = sanitize_sql_like(name.downcase)
      Player.where("lower(name) LIKE ?", "%#{sanitized}%")
    end

    def lookup_by_position(position)
      # Use PostgreSQL array contains operator to check if position is in positions array
      # @> operator checks if the left array contains the right array
      self.where("positions @> ARRAY[?]::text[]", position)
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

  def ensure_positions_is_array
    self.positions = [] if positions.nil?
    self.positions = positions.compact.uniq if positions.is_a?(Array)
  end

  def validate_positions
    return if positions.blank?

    invalid_positions = positions - POSITIONS
    if invalid_positions.any?
      errors.add(:positions, "contains invalid position(s): #{invalid_positions.join(', ')}")
    end
  end

  def cannot_be_free_agent_with_contract
    return unless is_free_agent?

    # Find active contract manually (scoped associations don't always work in validations)
    current_season = Season.current
    active_contract = contracts.find do |c|
      c.active &&
      current_season &&
      c.first_season_id <= current_season.id &&
      c.last_season_id >= current_season.id
    end

    return unless active_contract

    errors.add(
      :is_free_agent,
      "cannot be set to true - player has active contract with #{active_contract.team.name} through #{active_contract.last_season.name}"
    )
  end

  # Check if player has stats for a given season's target year
  # This is the source of truth for eligibility
  def self.has_stats_in_pybaseball?(bbrefid, target_year, positions)
    return false if bbrefid.blank? || target_year.blank?

    # Fetch stats from stats API microservice
    stats = StatsClient.fetch(bbrefid, target_year)
    return false unless stats&.present?

    # Check based on player positions (if they have any pitcher positions)
    is_pitcher = positions.is_a?(Array) ? positions.any? { |p| p.match?(/^(SP|RP)/) } : positions&.match?(/^(SP|RP)/)

    if is_pitcher
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
