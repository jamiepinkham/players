module Queries
    class FetchTrades < Queries::BaseQuery
        type [Types::TradeType], null: true
        argument :team, ID, required: true

        def resolve(team:)
            Trade.pending
                 .includes(:contracts, :from_team, :to_team)
                 .where(from_team_id: team)
                 .or(Trade.pending.includes(:contracts, :from_team, :to_team).where(to_team_id: team))
        end
    end

    class FetchCompletedTrades < Queries::BaseQuery
        type [Types::TradeType], null: true
        def resolve
            Trade.accepted
                 .includes(:contracts, :from_team, :to_team)
                 .order("updated_at DESC")
        end
    end
end