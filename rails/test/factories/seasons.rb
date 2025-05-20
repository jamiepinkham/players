FactoryBot.define do
  factory :season do
    sequence(:name) {|n| "Season #{n}"}
    is_active { false }
    sequence(:start_date) {|n| (Date.today + n.years).beginning_of_year }
    sequence(:end_date) {|n| (Date.today + n.years).end_of_year }
    sequence(:previous_season_id)
    sequence(:next_season_id) {|n| n + 1}

    trait :current do
      is_active { true }
      start_date { Date.today.beginning_of_year }
      end_date { Date.today.end_of_year }
    end
  
    factory :current_season, traits: [:current]
  
  end

end
