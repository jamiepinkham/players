# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    sequence(:username) { |n| "user#{n}" }
    password { 'password123' }
    password_confirmation { 'password123' }
    is_admin { false }
    team { nil }

    trait :team_owner do
      association :team
    end

    trait :admin do
      is_admin { true }
    end
  end
end
