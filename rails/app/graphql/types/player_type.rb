module Types
  class PlayerType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :bbrefid, String, null: true
    field :bbref_minors, String, null: true
    field :bbref_link, String, null: false
    field :bbref_stats, GraphQL::Types::JSON, null: true
    field :stats, [Types::StatType], null: true
    field :position, String, null: true
    field :bids, [Types::BidType], null: true do
      argument :leading, Boolean, required: false, default_value: false
    end
    field :contract_minimums, [Types::ContractMinimumType], null: false
    field :team, Types::TeamType, null: true
    field :contract, Types::ContractType, null: true
    field :is_trade_eligible, Boolean, null: false

    def is_trade_eligible
      return object.is_trade_eligible?
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
    

    def stats
      # puts "object.bbref_stats: #{object.bbref_stats.inspect}"
      stats = []
      JSON.parse(object.bbref_stats || "{}").each do |key, value| 
      #   puts "key: #{key}, value: #{value}"
      #   # puts "looking at #{entry[1].class.name}: #{key.inspect}"
      #   stat = Types::Stat.new
      #   stat.title = key
        stat = Types::Stat.new
        stat.title = key
        stat.value = value
        if key == 'Pos'
          stat.value = object.position
        end
        stats << stat
      end
      # stat = Types::Stat.new
      # stat.title = 'foo'
      # stat.value = 'bar'
      # # return [{'title' => 'foo', 'value' => 'bar'}]
      # return [{title: 'foo', value: 'bar'}]
      return stats
    end

    def team
      object.contract&.team
    end
  end

  class Stat
    attr_accessor :title
    attr_accessor :value
  end
end
