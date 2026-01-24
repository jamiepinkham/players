module Types
  class BidType < Types::BaseObject
    field :id, ID, null: false
    field :annual_amount, Float, null: true
    field :is_active, Boolean, null: false
    field :is_leading, Boolean, null: false
    field :team, Types::TeamType, null: false
    field :contract, Types::ContractType, null: true
    field :player, Types::PlayerType, null: true
    field :free_agency_period, Types::FreeAgencyPeriodType, null: true
    field :first_season, Types::SeasonType, null: true
    field :last_season, Types::SeasonType, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def first_season
      object.first_season_with_fallback
    end

    def last_season
      object.last_season_with_fallback
    end
  end
end
