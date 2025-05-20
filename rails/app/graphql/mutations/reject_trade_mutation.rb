class Mutations::RejectTradeMutation < Mutations::BaseMutation
    null true
    
    argument :id, ID, required: true

    field :trade, Types::TradeType, null: true

    def resolve(id:)
        trade = Trade.find(id)

        unless trade.pending?
            raise Exception, 'Trade is not pending so it cannot be rejected'
        end

        trade.reject!
        { trade: trade }
    end
end