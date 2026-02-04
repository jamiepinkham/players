module Types
  class PlayerType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :bbrefid, String, null: true
    field :bbref_minors, String, null: true
    field :bbref_link, String, null: false
    field :stats, GraphQL::Types::JSON, null: true do
      argument :year, Integer, required: false, default_value: nil
    end
    field :available_stat_years, [Integer], null: false
    field :position, String, null: true
    field :bids, [Types::BidType], null: true do
      argument :leading, Boolean, required: false, default_value: false
    end
    field :contract_minimums, [Types::ContractMinimumType], null: false
    field :team, Types::TeamType, null: true
    field :contract, Types::ContractType, null: true
    field :is_free_agent, Boolean, null: false
    field :is_trade_eligible, Boolean, null: false
    field :trade_ineligibility_reason, String, null: true

    def is_trade_eligible
      return object.is_trade_eligible?
    end

    def trade_ineligibility_reason
      return object.trade_ineligibility_reason
    end

    def bbref_link
      if !object.bbrefid.blank?
        return "https://www.baseball-reference.com/players/#{object.bbrefid[0].downcase}/#{object.bbrefid.downcase}.shtml"
      elsif !object.bbref_minors.blank?
        return "https://www.baseball-reference.com/register/player.fcgi?id=#{object.bbref_minors.downcase}"
      else
        return "https://www.baseball-reference.com/not_found"
      end
    end

    def bids(leading:)
        Season.current.active_free_agency_period.bids.where(player_id: object.id).leading
    end

    def contract_minimums
      max_seasons = Season.current.active_free_agency_period.max_contract_length
      current_season = Season.current
      fa_period = current_season.active_free_agency_period

      current_season.first(max_seasons).each_with_index.map do |last_season, i|
        {
          season: last_season,
          amount: fa_period.minimum_bid_for_player_and_season_range(object.id, current_season, last_season),
          duration: i + 1
        }
      end
    end

    def team
      object.contract&.team
    end

    def stats(year:)
      return {} if object.bbrefid.blank?

      # Default to current season's target stat year if no year provided
      stat_year = year || Season.current&.target_stat_year
      return {} unless stat_year

      # Find the season for this year
      season = Season.find_by(target_stat_year: stat_year)
      return {} unless season

      # Query PlayerStat from database
      player_stat = PlayerStat.find_by(player: object, season: season)
      player_stat&.stats || {}
    end

    def available_stat_years
      return [] if object.bbrefid.blank?

      # Return years from PlayerStat records for this player
      object.player_stats.joins(:season).pluck('seasons.target_stat_year').sort.reverse
    end
  end
end
