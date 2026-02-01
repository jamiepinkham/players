class FreeAgencyPeriod < ApplicationRecord
  belongs_to :season
  has_many :bids

  def convert_bids
    convert_leading_bids()
    set_leading_bids()
  end

  def convert_leading_bids
    # Get unique player IDs efficiently without loading full bid objects
    leading_player_ids = bids.leading.distinct.pluck(:player_id)

    leading_player_ids.each do |player_id|
      # Query only this player's bids (not all bids)
      player_leading_bids = bids.leading.where(player_id: player_id)
      player_active_bids = bids.active.where(player_id: player_id)

      # Find max total_amount for this player only
      leading_bid = player_leading_bids.max_by(&:total_amount)
      leading_active_bid = player_active_bids.max_by(&:total_amount)

      # Skip if no bids found
      next unless leading_bid

      if leading_active_bid && leading_active_bid.total_amount > leading_bid.total_amount
        # Bulk update all non-winning bids in a single query each
        player_leading_bids.where.not(id: leading_active_bid.id)
          .update_all(is_active: false, is_leading: false)
        player_active_bids.where.not(id: leading_active_bid.id)
          .update_all(is_active: false, is_leading: false)

        # Update the winning bid
        leading_active_bid.update!(is_leading: true, is_active: true)
      else
        # Create contract from leading bid
        Contract.contract_from_bid(leading_bid)

        # Bulk update all bids for this player in a single query
        bids.where(player_id: player_id).update_all(is_active: false, is_leading: false)
      end
    end
  end

  def set_leading_bids
    # Get unique player IDs efficiently without loading full bid objects
    active_player_ids = bids.active.distinct.pluck(:player_id)

    active_player_ids.each do |player_id|
      # Query only this player's active bids
      player_active_bids = bids.active.where(player_id: player_id)

      # Find the leading bid (max total_amount) for this player only
      leading_bid = player_active_bids.max_by(&:total_amount)

      next unless leading_bid

      # Bulk update all non-leading bids in a single query
      player_active_bids.where.not(id: leading_bid.id)
        .update_all(is_active: false, is_leading: false)

      # Update the leading bid
      leading_bid.update!(is_leading: true, is_active: true)
    end
  end

  def minimum_bid_for_player_and_season_range(player_id, first_season, last_season)
    season_count = first_season.count_seasons_to(last_season)

    # Load all leading bids for this player (typically 0-1 records)
    # max_by with total_amount calculation is unavoidable here since total_amount
    # is computed (annual_amount * contract_length), but scope is limited to one player
    leading_active_bid = bids.where(is_leading: true, player_id: player_id).max_by(&:total_amount)
    minimum_contract_amount = minimum_contract_amount_for_season_range(first_season, last_season)

    if leading_active_bid
      minimum_leading_bid_total_amount = leading_active_bid.total_amount * 1.2
      minimum_total_amount = [minimum_leading_bid_total_amount / season_count, minimum_contract_amount].max
      minimum_total_amount
    else
      minimum_contract_amount
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
