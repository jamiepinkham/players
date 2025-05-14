FactoryBot.define do
  factory :bid do
    player
    team
    number_of_years { (rand * 5).to_i + 1 }
    annual_amount { ((rand * 10).to_i + 1) * 1000000}

    trait :leading do
      is_leading { true }
      is_active { true }
      annual_amount {|b| 2 * Bid.minimum_contract_amount_for_years(b.number_of_years) }
    end

    trait :active do
      is_active { true }
    end

    # trait :minimum do
    #   number_of_years 1
    #   annual_amount {|b| Bid.minimum_contract_amount_for_years(b.number_of_years) }
    # end
  end
end
