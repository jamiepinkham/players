FactoryBot.define do
  factory :player do
    name { Faker::Name.name }
    position { "OF" }
  end
end
