require 'test_helper'

class TeamTest < ActiveSupport::TestCase
  test 'pending trades proposed get returned for pending_trades' do
    trade = create(:trade)
    assert_equal [trade], trade.from_team.pending_trades
  end

  test 'pending trades received get returned for pending_trades' do
    trade = create(:trade)
    assert_equal [trade], trade.to_team.pending_trades
  end

  test 'pending trades proposed and received get returned for pending_trades' do
    trade_1 = create(:trade)
    trade_2 = create(:trade, to_team: trade_1.from_team)
    assert_equal [trade_1, trade_2], trade_1.from_team.pending_trades
  end

  test 'accepted trades do not get returned for pending_trades' do
    trade = create(:trade, status: :accepted)
    assert trade.from_team.pending_trades.empty?
    assert trade.to_team.pending_trades.empty?
  end

  test 'rejected trades do not get returned for pending_trades' do
    trade = create(:trade, status: :rejected)
    assert trade.from_team.pending_trades.empty?
    assert trade.to_team.pending_trades.empty?
  end
end
