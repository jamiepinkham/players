class Mutations::CreateBidMutation < Mutations::BaseMutation
    null true
    
    argument :team_id, ID, required: true
    argument :player_id, ID, required: true
    argument :annual_amount, Float, required: true
    argument :final_season_id, ID, required: true

    field :bid, Types::BidType, null: true
    field :errors, [String], null: false

    def resolve(team_id:, player_id:, annual_amount:, final_season_id:)
        current_user = context[:current_user]

        # Check if user has a team
        unless current_user&.team
            raise GraphQL::ExecutionError, "You must be part of a team to place bids"
        end

        # Check if user owns the team they're bidding for
        team = Team.find_by(id: team_id)
        unless team && current_user.owns_team?(team)
            raise GraphQL::ExecutionError, "You can only place bids for your own team"
        end

        season = Season.current
        if season.nil?
            raise GraphQL::ExecutionError, "No active season"
        end

        free_agency_period = season.active_free_agency_period
        if free_agency_period.nil?
            raise GraphQL::ExecutionError "no active free agency period"
        end

        bid = Bid.new
        bid.player_id = player_id
        bid.team_id = team_id
        bid.annual_amount = annual_amount
        bid.first_season = season
        bid.last_season_id = final_season_id
        bid.free_agency_period = free_agency_period
        if bid.save
            {
                bid: bid,
                errors: []
            }
        else 
            raise GraphQL::ExecutionError, bid.errors.full_messages.join(", ")
        end
    end
end