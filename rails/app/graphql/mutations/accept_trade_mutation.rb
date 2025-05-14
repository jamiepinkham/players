class Mutations::AcceptTradeMutation < Mutations::BaseMutation
    null true
    
    argument :id, ID, required: true

    field :trade, Types::TradeType, null: true

    def resolve(id:)
        trade = Trade.find(id)

        unless trade.pending?
            raise GraphQL::ExecutionError, 'Trade is not pending so it cannot be accepted'
        end

        trade.accept!
        { trade: trade }
    end
end