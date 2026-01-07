FactoryBot.define do
  factory :bid do
    player
    team
    free_agency_period { Season.current&.active_free_agency_period }

    transient do
      contract_years { (rand * 5).to_i + 1 }
    end

    first_season { Season.current }
    last_season do
      season = first_season
      (contract_years - 1).times do
        season = season.next_season if season&.next_season
      end
      season
    end

    annual_amount { ((rand * 10).to_i + 1) * 1_000_000 }

    trait :leading do
      is_leading { true }
      is_active { true }
      annual_amount do |bid|
        years = bid.first_season.count_seasons_to(bid.last_season)
        2 * bid.free_agency_period.minimum_contract_amount_for_years(years)
      end
    end

    trait :active do
      is_active { true }
    end

    # trait :minimum do
    #   contract_years 1
    #   annual_amount {|b| b.free_agency_period.minimum_contract_amount_for_years(1) }
    # end
  end
end
