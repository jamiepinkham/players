class Mutations::AcceptTradeMutation < Mutations::BaseMutation
    null true
    
    argument :id, ID, required: true

    field :trade, Types::TradeType, null: true

    def resolve(id:)
        current_user = context[:current_user]

        # Check if user has a team
        unless current_user&.team
            raise GraphQL::ExecutionError, "You must be part of a team to accept trades"
        end

        trade = Trade.find(id)

        # Check if user owns the to_team (the team receiving the trade proposal)
        unless current_user.owns_team?(trade.to_team)
            raise GraphQL::ExecutionError, "You can only accept trades proposed to your team"
        end

        unless trade.pending?
            raise GraphQL::ExecutionError, 'Trade is not pending so it cannot be accepted'
        end

        trade.accept!
        { trade: trade }
    end
end