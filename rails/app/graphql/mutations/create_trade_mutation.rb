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
        current_user = context[:current_user]

        # Check if user has a team
        unless current_user&.team
            raise GraphQL::ExecutionError, "You must be part of a team to propose trades"
        end

        # Check if user owns the from_team
        from_team = Team.find_by(id: from_team_id)
        unless from_team && current_user.owns_team?(from_team)
            raise GraphQL::ExecutionError, "You can only propose trades from your own team"
        end

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
