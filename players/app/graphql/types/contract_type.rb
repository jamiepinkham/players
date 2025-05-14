module Types
  class ContractType < Types::BaseObject
    field :id, ID, null: false
    field :amount, Float, null: true
    field :first_season, Types::SeasonType, null: true
    field :last_season, Types::SeasonType, null: true
    field :team, Types::TeamType, null: true
    field :player, Types::PlayerType, null: true
    field :active, Boolean, null: true
    field :summer, Boolean, null: true
    field :franchise, Boolean, null: true
    field :winning_bid, Types::BidType, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: true
  end
end
