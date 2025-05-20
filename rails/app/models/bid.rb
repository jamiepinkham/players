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
  #validate :annual_amount_is_high_enough
  #validate :has_remaining_bids
  #validate :team_has_enough_funds

  #before_validation :sanitize_annual_amount
  #after_validation :restore_annual_amount
  #attr_accessor :original_annual_amount

  scope :leading, -> { where(is_leading: true) }
  scope :active, -> { where(is_active: true) }

  def season
    free_agency_period.season
  end

  def get_contract_length(start_season, end_season)
    raise ArgumentError.new(
      "Expected non-nil start_season"
    ) if start_season == nil
    raise ArgumentError.new(
      "Expected non-nil end_season"
    ) if start_season == nil
    if start_season == end_season
        return 1
    else
        return 1 + get_contract_length(start_season.next_season, end_season)
    end
 end
 
  def total_amount
    if self.last_season == nil 
      return self.number_of_years * self.annual_amount
    end
    return get_contract_length(season, last_season) * self.annual_amount
  end
end
