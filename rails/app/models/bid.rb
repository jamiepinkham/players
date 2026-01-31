class Bid < ApplicationRecord

  belongs_to :player
  belongs_to :team
  belongs_to :contract
  belongs_to :free_agency_period
  belongs_to :first_season, foreign_key: :first_season_id, class_name: 'Season'
  belongs_to :last_season, foreign_key: :last_season_id, class_name: 'Season'

  validates :player_id, presence: true
  validates :team_id, presence: true
  validates :annual_amount, presence: true, numericality: true
  validates :first_season_id, presence: true
  validates :last_season_id, presence: true
  #validate :annual_amount_is_high_enough
  #validate :has_remaining_bids
  #validate :team_has_enough_funds

  #before_validation :sanitize_annual_amount
  #after_validation :restore_annual_amount
  #attr_accessor :original_annual_amount

  scope :leading, -> { where(is_leading: true) }
  scope :active, -> { where(is_active: true) }

  def first_season_with_fallback
    first_season || Season.order(:id).first
  end

  def last_season_with_fallback
    last_season || Season.order(:id).first
  end

  def season
    free_agency_period.season
  end

  def contract_length
    first_season_with_fallback.count_seasons_to(last_season_with_fallback)
  end

  def total_amount
    contract_length * annual_amount
  end
end
