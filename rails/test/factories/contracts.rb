FactoryBot.define do
  factory :contract do
    player
    team
    association :first_season, factory: :season
    association :last_season, factory: :season
    amount { 1000000 }
    active { true }
    created_at { Time.now - 5.months }
  end
end
