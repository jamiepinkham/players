module Types
  class TradeStatusType < GraphQL::Schema::Enum
    value "pending", "Trade has not been accepted or rejected yet"
    value "accepted", "Trade has been accepted"
    value "rejected", "Trade has been rejected"
  end

  class TradeType < Types::BaseObject
    field :id, ID, null: false
    field :from_team, Types::TeamType, null: false
    field :from_cash_amount, Int, null: false
    field :from_contracts, [Types::ContractType], null: false
    field :to_team, Types::TeamType, null: false
    field :to_cash_amount, Int, null: false
    field :to_contracts, [Types::ContractType], null: false
    field :status, Types::TradeStatusType, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: true
  end
end
