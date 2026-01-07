FactoryBot.define do
  factory :team do
    name { Faker::Name.name }
    budget { 100000000 }

    after(:create) {|team| team.owner = create(:user); team.save!}
  end
end
