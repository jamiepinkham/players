FactoryBot.define do
    factory :trade do
        from_team factory: :team        
        from_cash_amount { 10 }
        to_team factory: :team        
        to_cash_amount { 20 }
        status { :pending }
    end
end

def multiplayer_trade
    FactoryBot.create(:trade) do |trade|
        FactoryBot.create_list(:contract, 3, team: trade.from_team)
        FactoryBot.create_list(:contract, 2, team: trade.to_team)
    end
end