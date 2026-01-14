FactoryBot.define do
  factory :team do
    name { Faker::Name.name }
    budget { 100000000 }

    after(:create) do |team|
      user = create(:user, team: team)
    end
  end
end
