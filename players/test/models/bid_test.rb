require 'test_helper'

class BidTest < ActiveSupport::TestCase
  # test "leading bid gets made into a contract and set to not leading if no other bids are higher" do
  #   player = create(:player)
  #   non_leading_bids = create_list(:bid, 5, :active, :minimum, player: player)
  #   leading_bid = create(:bid, :leading, player: player, number_of_years: 1, annual_amount: Bid.minimum_contract_amount_for_years(1) * 2)
  #   assert_difference 'Contract.count' do
  #     Bid.sign_contracts
  #   end
  #   contract = Contract.last
  #   leading_bid.reload
  #   assert_equal contract.id, leading_bid.contract_id
  # end

  # test "leading bid does not become a contract and set to not leading or active if another bid is higher" do
  #   player = create(:player)
  #   leading_bid = create(:bid, :leading, player: player)
  #   new_higher_bid = create(:bid, :active, player: player, annual_amount: leading_bid.annual_amount * 1.2, number_of_years: leading_bid.number_of_years)
  #   assert_no_difference 'Contract.count' do
  #     Bid.sign_contracts
  #   end
  #   leading_bid.reload
  #   assert leading_bid.contract_id.nil?
  #   assert !leading_bid.is_active?
  # end

  # test "non-leading bid becomes leading if it is the highest" do
  #   player = create(:player)
  #   leading_bid = create(:bid, :leading, player: player)
  #   new_higher_bid = create(:bid, :active, player: player, annual_amount: leading_bid.annual_amount * 1.2, number_of_years: leading_bid.number_of_years)
  #   assert_no_difference 'Contract.count' do
  #     Bid.sign_contracts
  #   end
  #   new_higher_bid.reload
  #   assert new_higher_bid.contract_id.nil?
  #   assert new_higher_bid.is_active?
  #   assert new_higher_bid.is_leading?
  # end

  # test "when a contract is made all bids for that player become inactive" do
  #   player = create(:player)
  #   non_leading_bids = create_list(:bid, 5, :active, :minimum, player: player)
  #   leading_bid = create(:bid, :leading, player: player)
  #   assert_difference 'Contract.count' do
  #     Bid.sign_contracts
  #   end
  #   non_leading_bids.each do |bid|
  #     bid.reload
  #     assert !bid.is_active?
  #   end
  # end

  # test "when a new bid becomes leading all other bids for that player become inactive and not leading" do
  #   player = create(:player)
  #   non_leading_bids = create_list(:bid, 5, :active, :minimum, player: player)
  #   leading_bid = create(:bid, :leading, player: player)
  #   new_leading_bid = create(:bid, :active, player: player, annual_amount: leading_bid.annual_amount * 1.2, number_of_years: leading_bid.number_of_years)

  #   assert_no_difference 'Contract.count' do
  #     Bid.sign_contracts
  #   end
  #   [leading_bid] + non_leading_bids.each do |bid|
  #     bid.reload
  #     assert !bid.is_active?
  #     assert !bid.is_leading?
  #   end
  # end

  # test "active bid becomes leading if it is the highest" do
  #   player = create(:player)
  #   highest_bid = create(:bid, :active, player: player)
  #   lower_bids = create_list(:bid, 5, :active, :minimum)
  #   Bid.update_leading_bids
  #   highest_bid.reload
  #   assert highest_bid.is_active?
  #   assert highest_bid.is_leading?
  # end

  # test "active bid gets set to inactive if it is not the highest" do
  #   player = create(:player)
  #   highest_bid = create(:bid, :active, player: player)
  #   lower_bids = create_list(:bid, 5, :active, :minimum)
  #   Bid.update_leading_bids
  #   lower_bids.each do |bid|
  #     bid.reload
  #     assert bid.is_active?
  #     assert bid.is_leading?
  #   end
  # end
end
