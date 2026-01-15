module Types
  class TeamType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: true
    field :budget, Float, null: true
    field :stadium, String, null: true
    field :current_contracts, [Types::ContractType], null: false
    field :user, Types::UserType, null: true
    field :primary_email, String, null: true
    field :current_payroll, Float, null: false
    field :available_cash, Float, null: false
    field :total_players, Int, null: false
    field :unsalaried_players, Int, null: false
    field :bids, [Types::BidType], null: false
    field :pending_trades, [Types::TradeType], null: false
  end
end
