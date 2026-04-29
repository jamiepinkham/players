# frozen_string_literal: true

FactoryBot.define do
  factory :trade do
    association :from_team, factory: :team
    association :to_team, factory: :team
    from_cash_amount { 0 }
    to_cash_amount { 0 }
    status { :pending }

    trait :pending do
      status { :pending }
    end

    trait :accepted do
      status { :accepted }
    end

    trait :rejected do
      status { :rejected }
    end

    # Aliases for test compatibility
    transient do
      initiating_team { nil }
      partner_team { nil }
    end

    before(:create) do |trade, evaluator|
      trade.from_team = evaluator.initiating_team if evaluator.initiating_team
      trade.to_team = evaluator.partner_team if evaluator.partner_team
    end
  end
end
