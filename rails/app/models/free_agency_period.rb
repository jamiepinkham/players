class FreeAgencyPeriod < ApplicationRecord
  belongs_to :season
  has_many :bids

  def convert_bids
    convert_leading_bids()
    set_leading_bids()
  end

  def convert_leading_bids()
    leading_bids = bids.leading.order(created_at: :desc)
    active_bids = bids.active.order(created_at: :desc)
    leading_player_ids = leading_bids.collect { |b| b.player_id }
    leading_player_ids.each do | player_id | 
      leading_bid = leading_bids.where(player_id: player_id).max_by &:total_amount
      leading_active_bid = active_bids.where(player_id: player_id).max_by &:total_amount
      if leading_active_bid.total_amount > leading_bid.total_amount 
        leading_bids.where(player_id: player_id).select { |b| b.id != leading_active_bid.id }.each do |b|
          b.is_active = false
          b.is_leading = false
          b.save!
        end
        active_bids.where(player_id: player_id).select { |b| b.id != leading_active_bid.id }.each do |b|
          b.is_active = false
          b.is_leading = false
          b.save!
        end
        leading_active_bid.is_leading = true
        leading_active_bid.is_active = true
        leading_active_bid.save!
      else
        Contract.contract_from_bid(leading_bid)
        active_bids.where(player_id: player_id).update_all(is_active: false, is_leading: false)
        leading_bids.where(player_id: player_id).update_all(is_active: false, is_leading: false)
      end
    end
  end

  def set_leading_bids()
    active_bids = bids.active.order(created_at: :desc)
    active_bid_player_ids = active_bids.collect { |b| b.player_id }
    active_bid_player_ids.each do | player_id | 
      leading_bid = active_bids.where(player_id: player_id).max_by &:total_amount
      active_bids.where(player_id: player_id).select { |b| b.id != leading_bid.id }.each do |b|
        b.is_active = false
        b.is_leading = false
        b.save!
      end
      leading_bid.is_leading = true
      leading_bid.is_active = true
      leading_bid.save!
    end
  end

  def minimum_bid_for_player_and_season_range(player_id, first_season, last_season)
    season_count = first_season.count_seasons_to(last_season)
    leading_active_bid = bids.where(is_leading: true).where(player_id: player_id).max_by(&:total_amount)
    minimum_contract_amount = minimum_contract_amount_for_season_range(first_season, last_season)

    if leading_active_bid
      minimum_leading_bid_total_amount = leading_active_bid.total_amount * 1.2
      minimum_total_amount = [minimum_leading_bid_total_amount / season_count, minimum_contract_amount].max
      return minimum_total_amount
    else
      return minimum_contract_amount
    end
  end

  # Deprecated: Use minimum_bid_for_player_and_season_range instead
  def minimum_bid_for_player_and_years(player_id, years)
    current_season = season
    last_season = current_season.first(years).last
    minimum_bid_for_player_and_season_range(player_id, current_season, last_season)
  end

  def minimum_contract_amount_for_season_range(first_season, last_season)
    season_count = first_season.count_seasons_to(last_season)
    minimum_contract_amount_for_years(season_count)
  end

  def minimum_contract_amount_for_years(years)
    case years
    when 1
      500_000
    when 2
      1_000_000
    when 3
      2_000_000
    when 4
      4_000_000
    when 5
      8_000_000
    else
      years
    end
  end
end
