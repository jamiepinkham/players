module Types
  class ContractMinimumType < Types::BaseObject
    field :season, Types::SeasonType, null: true
    field :amount, Float, null: true
    field :duration, Int, null: true
  end
end
