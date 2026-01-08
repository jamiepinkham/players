module Queries
    class FetchPlayers < Queries::BaseQuery
        type [Types::PlayerType], null: false
        argument :position, String, required: true

        def resolve(position:)
            previous_season = Season.current.previous_season
            # this breaks if a player has multiple contracts
            # update: this should be fixed now by checking to make sure they don't have an active contract
            # expiring_players = Player.includes(:leading_bid, :contract). \
            #     where(contract: { last_season_id: previous_season.id }). \
            #     joins(" LEFT OUTER JOIN contracts c2 on c2.player_id = players.id and c2.active = TRUE"). \
            #     where(" c2.id IS NULL"). \
            #     where.not(bbref_stats: nil). \
            #     lookup_by_position(position)
            unsigned_player_ids = Player.select(:id). \
                joins('LEFT JOIN contracts active ON players.id = active.player_id and active.active = true'). \
                where.not(bbref_stats: nil). \
                where('bbref_stats::TEXT <> \'"{}"\''). \
                group(:id). \
                having('count(active.id) = 0'). \
                lookup_by_position(position)

            unsigned_players = Player.includes(:leading_bid, contract: [:last_season, :team]).where(id: unsigned_player_ids)
            return unsigned_players # | expiring_players
        end
    end

    class FetchPlayer < Queries::BaseQuery
        type Types::PlayerType, null: false
        argument :id, ID, required: true

        def resolve(id:)
            Player.find(id)
        end
    end

    class SearchPlayers < Queries::BaseQuery
        type [Types::PlayerType], null: true
        argument :name, String, required: true
        def resolve(name:)
            if name.blank?
                Player.all
            else
                Player.search_name(name)
            end
        end
    end

    class ActivePlayers < Queries::BaseQuery
        type [Types::PlayerType], null: false
        def resolve
            season_id = Season.current.id
            Player.with_stats_or_current_contract(season_id).includes(contract: [:first_season, :last_season, :team])
        end
    end
end
