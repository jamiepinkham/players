module Queries
    class FetchPlayers < Queries::BaseQuery
        type [Types::PlayerType], null: false
        argument :position, String, required: true

        def resolve(position:)
            unsigned_player_ids = Player.select(:id)
                .joins('LEFT JOIN contracts active ON players.id = active.player_id and active.active = true')
                .where.not(bbref_stats: nil)
                .where('bbref_stats::TEXT <> \'"{}"\'')\
                .group(:id)
                .having('count(active.id) = 0')
                .lookup_by_position(position)

            Player.includes(:leading_bid, contract: [:last_season, :team]).where(id: unsigned_player_ids)
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
                    # Check if player has valid stats
                    has_valid_stats = false
                    if player.bbref_stats.present? && player.bbrefid.present? && player.bbrefid != ''
                        # Check if stats are not empty
                        stats_not_empty = if player.bbref_stats.is_a?(Hash)
                            !player.bbref_stats.empty?
                        elsif player.bbref_stats.is_a?(String)
                            player.bbref_stats != '{}' && player.bbref_stats.strip != ''
                        else
                            false
                        end

                        # Check if bbrefid matches pattern
                        if stats_not_empty && player.bbrefid.match?(/^[a-z0-9]{5,10}$/)
                            has_valid_stats = true
                        end
                    end

                    has_contract = player.contract.present?

                    case status
                    when 'Under Contract'
                        # Has an active contract for current season
                        has_contract
                    when 'Free Agent'
                        # Has valid stats but NO active contract
                        !has_contract && has_valid_stats
                    when 'Ineligible'
                        # No valid stats AND no active contract
                        !has_contract && !has_valid_stats
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
