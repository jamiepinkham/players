# frozen_string_literal: true

FactoryBot.define do
  factory :player do
    sequence(:name) { |n| Faker::Name.name }
    positions { ['SS'] }
    is_free_agent { false }
    bbrefid { nil }

    trait :free_agent do
      is_free_agent { true }
      bbrefid { Faker::Alphanumeric.alphanumeric(number: 9) }
    end

    trait :trade_eligible do
      is_free_agent { false }

      transient do
        team { nil }
      end

      after(:create) do |player, evaluator|
        if evaluator.team
          season = Season.find_or_create_by!(is_active: true) do |s|
            s.name = "Season #{Date.current.year}"
            s.year = Date.current.year
            s.start_date = Date.new(Date.current.year, 1, 1)
            s.end_date = Date.new(Date.current.year, 12, 31)
            s.league_minimum = 50_000
          end

          create(:contract, :active, :trade_eligible, player: player, team: evaluator.team,
                 first_season: season, last_season: season)
        end
      end
    end

    trait :recently_acquired do
      is_free_agent { false }

      transient do
        team { nil }
      end

      after(:create) do |player, evaluator|
        if evaluator.team
          season = Season.find_or_create_by!(is_active: true) do |s|
            s.name = "Season #{Date.current.year}"
            s.year = Date.current.year
            s.start_date = Date.new(Date.current.year, 1, 1)
            s.end_date = Date.new(Date.current.year, 12, 31)
            s.league_minimum = 50_000
          end

          create(:contract, :active, :recently_signed, player: player, team: evaluator.team,
                 first_season: season, last_season: season)
        end
      end
    end
  end
end
