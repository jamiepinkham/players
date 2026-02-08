module Types
  class SeasonType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: true
    field :is_active, Boolean, null: true
    field :target_stat_year, Integer, null: true
    field :active_free_agency_period, Types::FreeAgencyPeriodType, null: false
    field :start_date, GraphQL::Types::ISO8601DateTime, null: true
    field :end_date, GraphQL::Types::ISO8601DateTime, null: true
    field :previous_season, Types::SeasonType, null: true
    field :next_season, Types::SeasonType, null: true
  end
end
