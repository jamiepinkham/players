# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Trade System', type: :feature, js: true do
  let(:team_owner) { create(:user, :team_owner) }
  let(:team) { team_owner.team }
  let(:partner_team) { create(:team) }
  let!(:my_player) { create(:player, :trade_eligible, team: team) }
  let!(:their_player) { create(:player, :trade_eligible, team: partner_team) }
  let!(:ineligible_player) { create(:player, :recently_acquired, team: team) }

  before do
    sign_in team_owner
  end

  context 'TR-001: Access' do
    it 'loads new drag-and-drop interface with three-column layout' do
      visit trade_path

      expect(page).to have_css('[data-testid="trade-builder"]')
      expect(page).to have_css('[data-testid="your-roster"]')
      expect(page).to have_css('[data-testid="trade-zone"]')
      expect(page).to have_css('[data-testid="partner-roster"]')
    end
  end

  context 'TR-002 & TR-003: Select Trade Partner' do
    it 'shows all teams except current user team and loads selected team roster' do
      visit trade_path

      click_button 'Select trade partner'

      expect(page).to have_content(partner_team.name)
      expect(page).not_to have_content(team.name) # Current user's team not in list

      click_link partner_team.name

      within('[data-testid="partner-roster"]') do
        expect(page).to have_content(their_player.name)
      end
    end
  end

  context 'TR-004 & TR-005: Drag to Trade Zone' do
    before do
      visit trade_path
      select_trade_partner(partner_team)
    end

    it 'allows dragging your player to trade zone' do
      drag_player(my_player, to: 'trade-zone-sending')

      within('[data-testid="trade-zone-sending"]') do
        expect(page).to have_content(my_player.name)
      end
    end

    it 'allows dragging their player to trade zone' do
      drag_player(their_player, to: 'trade-zone-receiving')

      within('[data-testid="trade-zone-receiving"]') do
        expect(page).to have_content(their_player.name)
      end
    end
  end

  context 'TR-006: Drag Overlay' do
    before do
      visit trade_path
      select_trade_partner(partner_team)
    end

    it 'shows player card overlay while dragging' do
      player_card = find("[data-player-id='#{my_player.id}']")

      # Trigger drag start
      page.execute_script("
        const event = new DragEvent('dragstart', { bubbles: true });
        arguments[0].dispatchEvent(event);
      ", player_card.native)

      expect(page).to have_css('[data-testid="drag-overlay"]')
      within('[data-testid="drag-overlay"]') do
        expect(page).to have_content(my_player.name)
      end
    end
  end

  context 'TR-007: Drag Back to Roster' do
    before do
      visit trade_path
      select_trade_partner(partner_team)
      drag_player(my_player, to: 'trade-zone-sending')
    end

    it 'removes player from trade zone when dragged back to roster' do
      drag_player(my_player, to: 'your-roster', from: 'trade-zone-sending')

      within('[data-testid="trade-zone-sending"]') do
        expect(page).not_to have_content(my_player.name)
      end

      within('[data-testid="your-roster"]') do
        expect(page).to have_content(my_player.name)
      end
    end
  end

  context 'TR-008 & TR-009: Cash Input' do
    before do
      visit trade_path
      select_trade_partner(partner_team)
    end

    it 'accepts currency format for cash to send and appears in summary' do
      fill_in 'cash_to_send', with: '50000'

      within('[data-testid="trade-summary"]') do
        expect(page).to have_content('$50,000')
      end
    end

    it 'accepts currency format for cash to receive' do
      fill_in 'cash_to_receive', with: '25000'

      within('[data-testid="trade-summary"]') do
        expect(page).to have_content('$25,000')
      end
    end
  end

  context 'TR-010 & TR-011: Ineligible Player' do
    before do
      visit trade_path
    end

    it 'shows ineligibility reason and grays out ineligible player' do
      player_card = find("[data-player-id='#{ineligible_player.id}']")

      expect(player_card).to have_css('.grayed-out')
      expect(player_card).to have_content('Just acquired via trade')
    end

    it 'disables drag for ineligible player' do
      player_card = find("[data-player-id='#{ineligible_player.id}']")

      expect(player_card['draggable']).to eq('false').or be_nil
      # Check cursor style
      cursor_style = page.evaluate_script("getComputedStyle(arguments[0]).cursor", player_card.native)
      expect(cursor_style).to eq('not-allowed')
    end
  end

  context 'TR-012: Ineligible Player Error' do
    it 'shows error message if ineligible player somehow added to trade' do
      # This might require bypassing UI validation for testing
      visit trade_path
      select_trade_partner(partner_team)

      # Simulate adding ineligible player via console
      page.execute_script("
        window.tradeBuilder.addPlayerToTrade(#{ineligible_player.id}, 'sending');
      ")

      click_button 'Propose Trade'

      expect(page).to have_content("Ineligible players: #{ineligible_player.name}")
    end
  end

  context 'TR-013: Trade Summary' do
    before do
      visit trade_path
      select_trade_partner(partner_team)
      drag_player(my_player, to: 'trade-zone-sending')
      drag_player(their_player, to: 'trade-zone-receiving')
      fill_in 'cash_to_send', with: '10000'
    end

    it 'shows accurate trade summary' do
      within('[data-testid="trade-summary"]') do
        expect(page).to have_content('Sending: 1 player + $10,000')
        expect(page).to have_content('Receiving: 1 player')
      end
    end
  end

  context 'TR-014 & TR-015: Validation' do
    before do
      visit trade_path
    end

    it 'shows error when trying to submit empty trade' do
      select_trade_partner(partner_team)
      click_button 'Propose Trade'

      expect(page).to have_content('Trade must include at least one player or cash')
    end

    it 'shows error when no partner selected' do
      drag_player(my_player, to: 'trade-zone-sending')
      click_button 'Propose Trade'

      expect(page).to have_content('Please select a trade partner')
    end
  end

  context 'TR-017: Submit Valid Trade' do
    before do
      visit trade_path
      select_trade_partner(partner_team)
      drag_player(my_player, to: 'trade-zone-sending')
      drag_player(their_player, to: 'trade-zone-receiving')
    end

    it 'submits trade and shows success' do
      click_button 'Propose Trade'

      expect(page).to have_content('Submitting...')

      expect(page).to have_content('Trade proposed successfully')
      expect(Trade.last.initiating_team).to eq(team)
      expect(Trade.last.partner_team).to eq(partner_team)
    end
  end

  context 'TR-018 & TR-019: Pre-population from Detail Page' do
    it 'opens trade builder with player pre-selected from detail page' do
      visit player_path(their_player)
      click_button 'INITIATE TRADE'

      expect(current_path).to eq(trade_path)
      expect(page).to have_current_path(/player_id=#{their_player.id}/)

      # Verify partner team is pre-selected
      within('[data-testid="partner-selector"]') do
        expect(page).to have_content(partner_team.name)
      end

      # Verify player is in trade zone
      within('[data-testid="trade-zone-receiving"]') do
        expect(page).to have_content(their_player.name)
      end
    end
  end

  context 'TR-020: Pending Trades - View All' do
    let!(:pending_trade) { create(:trade, :pending, initiating_team: team, partner_team: partner_team) }

    it 'displays all pending trades' do
      visit trades_pending_path

      expect(page).to have_content('Pending Trades')
      expect(page).to have_css("[data-trade-id='#{pending_trade.id}']")
    end
  end

  context 'TR-021: Collapsible Summary' do
    let!(:pending_trade) { create(:trade, :pending, initiating_team: team, partner_team: partner_team) }

    it 'expands to show trade details' do
      visit trades_pending_path

      trade_item = find("[data-trade-id='#{pending_trade.id}']")
      trade_item.click

      within(trade_item) do
        expect(page).to have_css('.trade-details.expanded')
        expect(page).to have_content(team.name)
        expect(page).to have_content(partner_team.name)
      end
    end
  end

  context 'TR-022 & TR-023: Approve/Reject Trade' do
    let(:partner_owner) { create(:user, team: partner_team) }
    let!(:pending_trade) { create(:trade, :pending, initiating_team: team, partner_team: partner_team) }

    before do
      sign_in partner_owner
      visit trades_pending_path
    end

    it 'allows partner to approve trade' do
      within("[data-trade-id='#{pending_trade.id}']") do
        click_button 'Approve'
      end

      expect(page).to have_content('Trade approved')
      expect(pending_trade.reload.status).to eq('approved')
    end

    it 'allows partner to reject trade' do
      within("[data-trade-id='#{pending_trade.id}']") do
        click_button 'Reject'
      end

      expect(page).to have_content('Trade rejected')
      expect(pending_trade.reload.status).to eq('rejected')
    end
  end

  context 'TR-024: Notification Dot' do
    let!(:pending_trade) { create(:trade, :pending, partner_team: team) }

    it 'shows notification dot on hamburger menu when pending trades exist' do
      visit root_path

      expect(page).to have_css('[data-testid="notification-dot"]')
    end
  end

  private

  def select_trade_partner(team)
    click_button 'Select trade partner'
    click_link team.name
  end

  def drag_player(player, to:, from: nil)
    player_selector = "[data-player-id='#{player.id}']"
    player_selector = "[data-testid='#{from}'] #{player_selector}" if from

    page.execute_script("
      const player = document.querySelector('#{player_selector}');
      const target = document.querySelector('[data-testid=\"#{to}\"]');

      const dragStartEvent = new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() });
      player.dispatchEvent(dragStartEvent);

      const dropEvent = new DragEvent('drop', { bubbles: true, dataTransfer: dragStartEvent.dataTransfer });
      target.dispatchEvent(dropEvent);

      const dragEndEvent = new DragEvent('dragend', { bubbles: true });
      player.dispatchEvent(dragEndEvent);
    ")

    sleep 0.1 # Allow React to update
  end
end
