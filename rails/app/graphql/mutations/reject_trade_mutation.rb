class Mutations::RejectTradeMutation < Mutations::BaseMutation
    null true
    
    argument :id, ID, required: true

    field :trade, Types::TradeType, null: true

    def resolve(id:)
        current_user = context[:current_user]

        # Check if user has a team
        unless current_user&.team
            raise GraphQL::ExecutionError, "You must be part of a team to reject trades"
        end

        trade = Trade.find(id)

        # Check if user owns either team involved in the trade
        unless current_user.owns_team?(trade.from_team) || current_user.owns_team?(trade.to_team)
            raise GraphQL::ExecutionError, "You can only reject trades involving your team"
        end

        unless trade.pending?
            raise GraphQL::ExecutionError, 'Trade is not pending so it cannot be rejected'
        end

        trade.reject!
        { trade: trade }
    end
end