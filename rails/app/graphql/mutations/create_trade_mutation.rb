class Mutations::CreateTradeMutation < Mutations::BaseMutation
    null true
    
    argument :to_team_id, ID, required: true
    argument :from_team_id, ID, required: true
    argument :to_contract_ids, [ID], required: true
    argument :from_contract_ids, [ID], required: true
    argument :from_cash, Int, required: false
    argument :to_cash, Int, required: false

    field :trade, Types::TradeType, null: true
    field :errors, [String], null: false

    def resolve(to_team_id:, from_team_id:, to_contract_ids:, from_contract_ids:, from_cash:, to_cash:)
        t = Trade.new
        t.contract_ids = to_contract_ids + from_contract_ids
        t.to_team_id = to_team_id
        t.from_team_id = from_team_id
        t.from_cash_amount = from_cash
        t.to_cash_amount = to_cash
        if t.save
            {
                trade: t,
                errors: []
            }
        else 
            raise GraphQL::ExecutionError, t.errors.full_messages.join(", ")
        end
    end
end
