module Types
  class FreeAgencyPeriodType < Types::BaseObject
    field :id, ID, null: false
    field :is_active, Boolean, null: true
    field :bids, [Types::BidType], null: true do
      argument :team_id, ID, required: false
      argument :active, Boolean, required: false, default_value: false
    end
    field :start_date, GraphQL::Types::ISO8601DateTime, null: true
    field :end_date, GraphQL::Types::ISO8601DateTime, null: true
    field :max_contract_length, Integer, null: false
    field :max_bids_for_team, Integer, null: false

    def bids(team_id:, active:)
      if team_id
        Bid.where(free_agency_period_id: object.id, team_id: team_id, is_active: active)
      else
        Bid.where(free_agency_period_id: object.id, is_active: active)
      end
    end

  end
end
