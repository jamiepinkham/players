# frozen_string_literal: true

FactoryBot.define do
  factory :contract do
    association :player
    association :team
    amount { 100_000 }
    active { true }
    summer { false }

    transient do
      first_season { nil }
      last_season { nil }
    end

    before(:create) do |contract, evaluator|
      current_season = Season.find_or_create_by!(is_active: true) do |s|
        s.name = "Season #{Date.current.year}"
        s.year = Date.current.year
        s.start_date = Date.new(Date.current.year, 1, 1)
        s.end_date = Date.new(Date.current.year, 12, 31)
        s.league_minimum = 50_000
      end

      contract.first_season = evaluator.first_season || current_season
      contract.last_season = evaluator.last_season || current_season
    end

    trait :active do
      active { true }
    end

    trait :inactive do
      active { false }
    end

    trait :trade_eligible do
      created_at { 4.months.ago }
      summer { false }
    end

    trait :recently_signed do
      created_at { 1.week.ago }
      summer { false }
    end

    trait :expired do
      active { false }

      before(:create) do |contract|
        past_season = Season.create!(
          name: "Season #{Date.current.year - 2}",
          year: Date.current.year - 2,
          start_date: Date.new(Date.current.year - 2, 1, 1),
          end_date: Date.new(Date.current.year - 2, 12, 31),
          league_minimum: 50_000,
          is_active: false
        )
        contract.first_season = past_season
        contract.last_season = past_season
      end
    end

    trait :expired_last_season do
      active { false }

      before(:create) do |contract|
        last_season = Season.create!(
          name: "Season #{Date.current.year - 1}",
          year: Date.current.year - 1,
          start_date: Date.new(Date.current.year - 1, 1, 1),
          end_date: Date.new(Date.current.year - 1, 12, 31),
          league_minimum: 50_000,
          is_active: false
        )
        contract.first_season = last_season
        contract.last_season = last_season
      end
    end
  end
end
