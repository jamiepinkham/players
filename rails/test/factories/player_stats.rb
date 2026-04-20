# frozen_string_literal: true

FactoryBot.define do
  factory :player_stat do
    association :player
    year { 2025 }
    data { {} }

    trait :position_player do
      data do
        {
          'PA' => 650,
          'AB' => 580,
          'H' => 175,
          'HR' => 35,
          'R' => 95,
          'RBI' => 100,
          'BA' => '.302',
          'OBP' => '.375',
          'SLG' => '.550',
          'OPS' => '.925',
          'WAR' => '5.5'
        }
      end
    end

    trait :pitcher do
      data do
        {
          'IP' => '200.0',
          'ERA' => '3.25',
          'W' => 15,
          'L' => 8,
          'SV' => 0,
          'WHIP' => '1.15',
          'WAR' => '4.2'
        }
      end
    end
  end
end
