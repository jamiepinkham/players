# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Free Agency & Bidding', type: :feature, js: true do
  let(:team_owner) { create(:user, :team_owner) }
  let(:team) { team_owner.team }
  let(:fa_period) { create(:free_agency_period, :active) }
  let(:free_agent) { create(:player, :free_agent) }

  before do
    sign_in team_owner
  end

  describe 'Bidding Page' do
    context 'FA-012: Budget Display' do
      it 'displays team budget info at top and updates after placing/removing bids' do
        visit bidding_path

        expect(page).to have_css('[data-testid="team-budget"]')

        initial_budget = find('[data-testid="team-budget"]').text

        # Place a bid
        fill_in "bid-amount-#{free_agent.id}", with: '100000'
        click_button 'Place Bid'

        expect(page).to have_content('Bid placed successfully')
        expect(find('[data-testid="team-budget"]').text).not_to eq(initial_budget)
      end
    end

    context 'FA-013: Search Input Focus' do
      it 'maintains focus when typing quickly and switching tabs' do
        visit bidding_path

        # Switch to a position tab
        click_link 'SS'

        # Click search and type quickly
        search_input = find('[data-testid="player-search"]')
        search_input.click
        search_input.send_keys('test')

        # Verify all characters appear and focus is maintained
        expect(search_input.value).to eq('test')
        expect(page.evaluate_script('document.activeElement')).to eq(search_input.native)
      end
    end

    context 'FA-014: Position Player List' do
      let!(:shortstop) { create(:player, :free_agent, positions: ['SS']) }
      let!(:pitcher) { create(:player, :free_agent, positions: ['SP']) }

      it 'loads player lists correctly when switching position tabs' do
        visit bidding_path

        click_link 'SS'
        expect(page).to have_content(shortstop.name)
        expect(page).not_to have_content(pitcher.name)

        click_link 'SP'
        expect(page).to have_content(pitcher.name)
        expect(page).not_to have_content(shortstop.name)
      end
    end

    context 'FA-015: Layout Stability' do
      it 'loads without layout jumping or overflow' do
        visit bidding_path

        # Check for stable tab height
        tab_height = page.evaluate_script("document.querySelector('[data-testid=\"position-tabs\"]').offsetHeight")

        sleep 0.5 # Wait for any async loading

        new_tab_height = page.evaluate_script("document.querySelector('[data-testid=\"position-tabs\"]').offsetHeight")
        expect(new_tab_height).to eq(tab_height)

        # Check for overflow
        has_overflow = page.evaluate_script('document.body.scrollWidth > document.body.clientWidth')
        expect(has_overflow).to be false
      end
    end
  end

  describe 'Bid Conversion' do
    let(:admin) { create(:user, :admin) }
    let!(:winning_bid) { create(:bid, team: team, amount: 100_000, player: free_agent, leading: true) }

    before do
      sign_in admin
    end

    context 'FA-003: Manual Bid Conversion' do
      it 'displays summary with contracts created, bids outbid, new leading bids, email failures' do
        output = `bundle exec rake convert_bids:convert_leading RAILS_ENV=test 2>&1`

        expect(output).to include('contracts created')
        expect(output).to include('bids outbid')
        expect(output).to include('new leading bids')
        expect(output).to include('email')
      end
    end

    context 'FA-005 & FA-006: Inactive FA Period Alert' do
      it 'sends alert email and exits gracefully when FA period is inactive' do
        fa_period.update(active: false)

        expect {
          `bundle exec rake convert_bids:convert_leading RAILS_ENV=test 2>&1`
        }.to change { ActionMailer::Base.deliveries.count }.by_at_least(1)

        email = ActionMailer::Base.deliveries.last
        expect(email.subject).to include('Inactive FA Period')

        # Verify no conversion occurred
        expect(Contract.where(player: free_agent).exists?).to be false
      end
    end
  end

  describe 'Home Team Discount' do
    let!(:previous_contract) do
      create(:contract, :expired_last_season, player: free_agent, team: team, amount: 50_000)
    end

    context 'FA-007: Standard Re-signing' do
      it 'applies 15% discount for home team re-signing' do
        winning_bid = create(:bid, team: team, amount: 100_000, player: free_agent, leading: true)

        ConvertBidsService.new(fa_period).convert_leading_bids

        contract = Contract.find_by(player: free_agent, active: true)
        expect(contract.amount).to eq(85_000) # 15% discount
      end
    end

    context 'FA-008: League Minimum Floor' do
      it 'respects league minimum even with discount' do
        winning_bid = create(:bid, team: team, amount: Season.current.league_minimum, player: free_agent, leading: true)

        ConvertBidsService.new(fa_period).convert_leading_bids

        contract = Contract.find_by(player: free_agent, active: true)
        expect(contract.amount).to be >= Season.current.league_minimum
      end
    end

    context 'FA-009: New Player (No Previous Contract)' do
      let(:new_player) { create(:player, :free_agent) }

      it 'uses full bid amount with no discount' do
        winning_bid = create(:bid, team: team, amount: 100_000, player: new_player, leading: true)

        ConvertBidsService.new(fa_period).convert_leading_bids

        contract = Contract.find_by(player: new_player, active: true)
        expect(contract.amount).to eq(100_000)
      end
    end

    context 'FA-010: Different Team' do
      let(:other_team) { create(:team) }

      it 'uses full bid amount when player switches teams' do
        winning_bid = create(:bid, team: other_team, amount: 100_000, player: free_agent, leading: true)

        ConvertBidsService.new(fa_period).convert_leading_bids

        contract = Contract.find_by(player: free_agent, active: true)
        expect(contract.amount).to eq(100_000)
      end
    end

    context 'FA-011: Gap in Contract' do
      it 'uses full bid amount when contract expired 2+ seasons ago' do
        previous_contract.update(end_year: Season.current.year - 2)
        winning_bid = create(:bid, team: team, amount: 100_000, player: free_agent, leading: true)

        ConvertBidsService.new(fa_period).convert_leading_bids

        contract = Contract.find_by(player: free_agent, active: true)
        expect(contract.amount).to eq(100_000)
      end
    end
  end
end
