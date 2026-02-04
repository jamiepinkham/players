module Queries
    class FetchPlayers < Queries::BaseQuery
        type Types::PaginatedPlayersType, null: false
        argument :position, String, required: true
        argument :page, Integer, required: false, default_value: 1
        argument :per_page, Integer, required: false, default_value: 25
        argument :search, String, required: false
        argument :sort_by, String, required: false
        argument :sort_direction, String, required: false, default_value: "desc"

        def resolve(position:, page:, per_page:, search: nil, sort_by: nil, sort_direction: "desc")
            # Base query for free agents
            players_query = Player.where(is_free_agent: true)
                .lookup_by_position(position)

            # Apply search filter
            if search.present?
                players_query = players_query.where("lower(name) LIKE ?", "%#{Player.sanitize_sql_like(search.downcase)}%")
            end

            # Get all players matching criteria
            players = players_query.includes(:leading_bid, contract: [:last_season, :team], :player_stats)
                .to_a

            # Sort by stats if sort_by is provided
            if sort_by.present?
                current_season = Season.current
                players.sort_by! do |player|
                    begin
                        # Get stats from player_stats table
                        player_stat = player.player_stats.find { |ps| ps.season_id == current_season&.id }
                        stat_value = player_stat&.stats&.dig(sort_by)
                        # Convert to float, default to 0 if nil or invalid
                        stat_value.to_f
                    rescue TypeError
                        0.0
                    end
                end
                players.reverse! if sort_direction.downcase == "desc"
            end

            # Calculate pagination metadata
            total_count = players.length
            total_pages = (total_count.to_f / per_page).ceil
            offset = (page - 1) * per_page
            paginated_players = players[offset, per_page] || []

            {
                players: paginated_players,
                total_count: total_count,
                total_pages: total_pages,
                current_page: page,
                per_page: per_page,
                has_next_page: page < total_pages,
                has_previous_page: page > 1
            }
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

    class ActivePlayersPaginated < Queries::BaseQuery
        type Types::PaginatedPlayersType, null: false

        argument :page, Integer, required: false, default_value: 1
        argument :per_page, Integer, required: false, default_value: 25
        argument :name_search, String, required: false, default_value: ""
        argument :position, String, required: false, default_value: ""
        argument :status, String, required: false, default_value: ""
        argument :sort_direction, String, required: false, default_value: "asc"

        def resolve(page:, per_page:, name_search:, position:, status:, sort_direction:)
            season_id = Season.current.id

            # Choose base query based on status filter
            # If filtering by Ineligible, we need ALL players, not just those with stats/contracts
            if status == 'Ineligible'
                players = Player.all
            else
                # For other statuses, use the optimized query
                players = Player.with_stats_or_current_contract(season_id)
            end

            # Apply name and position filters (these work on player attributes)
            players = players.search_name(name_search) if name_search.present?
            players = players.lookup_by_position(position) if position.present?

            # Get the player IDs from the filtered query
            # Handle DISTINCT ON if present
            if status == 'Ineligible'
                player_ids = players.pluck(:id)
            else
                player_ids = players.pluck(:id)
            end

            # Now query those players properly with contract included for status filtering
            filtered_players = Player.where(id: player_ids).includes(:contract)

            # Apply status filtering in Ruby to have accurate contract data
            if status.present?
                filtered_players = filtered_players.select do |player|
                    has_contract = player.contract.present?

                    case status
                    when 'Under Contract'
                        # Has an active contract for current season
                        has_contract
                    when 'Free Agent'
                        # Use is_free_agent flag (set by system based on stats validation)
                        player.is_free_agent?
                    when 'Ineligible'
                        # Not a free agent and no active contract
                        !player.is_free_agent? && !has_contract
                    else
                        true
                    end
                end
            else
                filtered_players = filtered_players.to_a
            end

            # Apply sorting
            direction = sort_direction.downcase
            filtered_players.sort_by! { |p| p.name.downcase }
            filtered_players.reverse! if direction == 'desc'

            # Get total count
            total_count = filtered_players.length

            # Apply pagination (already have includes from earlier query)
            offset = (page - 1) * per_page
            paginated_players = filtered_players[offset, per_page] || []

            # Calculate metadata
            total_pages = (total_count.to_f / per_page).ceil

            {
                players: paginated_players,
                total_count: total_count,
                total_pages: total_pages,
                current_page: page,
                per_page: per_page,
                has_next_page: page < total_pages,
                has_previous_page: page > 1
            }
        end
    end
end
