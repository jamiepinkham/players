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
        type Types::PaginatedTradesType, null: true
        argument :page, Integer, required: false, default_value: 1
        argument :per_page, Integer, required: false, default_value: 50
        argument :team_id, ID, required: false
        argument :search, String, required: false

        def resolve(page:, per_page:, team_id: nil, search: nil)
            trades = Trade.accepted

            # Filter by team (either from or to)
            if team_id.present?
                trades = trades.where(from_team_id: team_id)
                              .or(Trade.accepted.where(to_team_id: team_id))
            end

            # Filter by search (player names or team names)
            if search.present?
                sanitized_search = "%#{ActiveRecord::Base.sanitize_sql_like(search)}%"
                trades = trades.joins(:from_team, :to_team)
                              .joins(contracts: :player)
                              .where(
                                "LOWER(players.name) LIKE LOWER(?) OR LOWER(teams.name) LIKE LOWER(?) OR LOWER(to_teams_trades.name) LIKE LOWER(?)",
                                sanitized_search, sanitized_search, sanitized_search
                              )
                              .distinct
            end

            trades = trades.includes(contracts: :player, from_team: {}, to_team: {})
                          .order("trades.updated_at DESC")

            total_count = trades.count
            total_pages = (total_count.to_f / per_page).ceil
            offset = (page - 1) * per_page

            paginated_trades = trades.offset(offset).limit(per_page)

            {
                trades: paginated_trades,
                total_count: total_count,
                total_pages: total_pages,
                current_page: page,
                per_page: per_page
            }
        end
    end
end