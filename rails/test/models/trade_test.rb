require "test_helper"

class TradeTest < ActiveSupport::TestCase
  test "accepting trade updates status" do
    trade = create(:trade)
    trade.accept!
    assert(trade.status_accepted?)
  end

  test "rejecting trade updates status" do
    trade = create(:trade)
    trade.reject!
    assert(trade.status_rejected?)
  end

  test "target team is emailed after trade is created" do
    trade = build(:trade)
    # this is just testing that an after_crate exists with a call to UserMailer
    # and I can't figure out how to get Rails test to verify that
  end

  test "when trade is complete players switch teams" do
    trade = multiplayer_trade
    team_1_players = trade.contracts.select{|c| c.team_id == trade.from_team_id}
    team_2_players = trade.contracts.select{|c| c.team_id == trade.to_team_id}

    trade.accept!

    team_1_players.each do |player|
      assert_equal(trade.to_team_id, player.contract.team_id)
    end
    team_2_players.each do |player|
      assert_equal(trade.from_team_id, player.contract.team_id)
    end
  end
  
  test "when trade is complete cash switches teams" do
    trade = create(:trade)
    team_1_cash = trade.from_team.available_cash
    team_2_cash = trade.to_team.available_cash

    trade.accept!

    assert_equal(team_1_cash - trade.from_cash_amount + trade.to_cash_amount, trade.from_team.available_cash)
    assert_equal(team_2_cash - trade.to_cash_amount + trade.from_cash_amount, trade.to_team.available_cash)
  end

  test "when trade is rejected players do not switch teams" do
    trade = multiplayer_trade
    team_1_players = trade.contracts.select{|c| c.team_id == trade.from_team_id}
    team_2_players = trade.contracts.select{|c| c.team_id == trade.to_team_id}

    trade.reject!

    team_1_players.each do |player|
      assert_equal(trade.from_team_id, player.contract.team_id)
    end
    team_2_players.each do |player|
      assert_equal(trade.to_team_id, player.contract.team_id)
    end
  end

  test "when trade is rejected cash does not switch teams" do
    trade = create(:trade)
    team_1_cash = trade.from_team.available_cash
    team_2_cash = trade.to_team.available_cash

    trade.reject!

    assert_equal(trade.from_team.available_cash, team_1_cash)
    assert_equal(trade.to_team.available_cash, team_2_cash)
  end

  test "summer draftee traded removes summer designation" do
    # how are summer designations defined?
    create(:current_season)
    contract = create(:contract, summer: true)
    trade = build(:trade, from_team: contract.team)
    trade.contracts << contract
    trade.save

    trade.accept!

    updated_contract = Contract.find(contract.id)
    assert_not(updated_contract.summer?)
  end

  test "player signed in the last 3 months cannot be traded" do
    contract = create(:contract, created_at: Time.now - 2.months)
    trade = build(:trade)
    trade.contracts << contract

    assert_not(trade.save)
  end

  test "contracts in trade cannot be owned by another team" do
    create(:current_season)
    trade = create(:trade)
    from_contracts = create_list(:contract, 2, team_id: trade.from_team_id)
    to_contracts = create_list(:contract, 2, team_id: trade.to_team_id)
    trade.contracts = from_contracts + to_contracts
    assert(trade.valid?)

    trade.contracts << create(:contract)

    assert_not(trade.valid?)
  end

  test "franchise player cannot be traded" do
    create(:current_season)
    contract = create(:contract, franchise: true)
    trade = build(:trade, from_team: contract.team)
    trade.contracts << contract
    assert_not(trade.valid?)
  end

  test "trade can be created in july" do
    travel_to Time.zone.local(2021, 7, 31, 1, 4, 44)
    trade = build(:trade)
    assert(trade.save)
  end

  test "trade cannot be created in august" do
    travel_to Time.zone.local(2021, 8, 2, 1, 4, 44)
    trade = build(:trade)
    assert_not(trade.save)
  end

  test "trade cannot be created in september" do
    travel_to Time.zone.local(2021, 9, 2, 1, 4, 44)
    trade = build(:trade)
    assert_not(trade.save)
  end

  test "trade cannot be created in october" do
    travel_to Time.zone.local(2021, 10, 2, 1, 4, 44)
    trade = build(:trade)
    assert_not(trade.save)
  end

  test "trade cannot be created in november" do
    travel_to Time.zone.local(2021, 11, 2, 1, 4, 44)
    trade = build(:trade)
    assert_not(trade.save)
  end

  test "trade can be created in december" do
    travel_to Time.zone.local(2021, 12, 2, 1, 4, 44)
    trade = build(:trade)
    assert(trade.save)
  end

  test "from team cannot add more cash to a trade than in cash available balance" do
    from_team = create(:team)
    trade = build(:trade, from_cash_amount: from_team.available_cash + 10)
    assert_not(trade.save)
  end

  test "to team cannot add more cash to a trade than in cash available balance" do
    to_team = create(:team)
    trade = build(:trade, to_cash_amount: to_team.available_cash + 10)
    assert_not(trade.save)
  end
end

