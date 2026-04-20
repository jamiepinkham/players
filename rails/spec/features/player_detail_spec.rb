# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Player Detail Page', type: :feature, js: true do
  let(:team_owner) { create(:user, :team_owner) }
  let(:team) { team_owner.team }
  let(:player) { create(:player, positions: ['SS', '2B'], team: team) }
  let(:free_agent) { create(:player, :free_agent, positions: ['OF']) }

  before do
    sign_in team_owner
  end

  context 'PS-001: Access' do
    it 'navigates to player detail page from players list' do
      visit players_path
      click_link player.name

      expect(current_path).to eq(player_path(player))
      expect(page).to have_content(player.name)
    end
  end

  context 'PS-002 & PS-003: Avatar and Basic Info' do
    it 'displays player avatar, name, positions, and team' do
      visit player_path(player)

      expect(page).to have_css('[data-testid="player-avatar"]')
      expect(page).to have_content(player.name)
      expect(page).to have_content('SS, 2B') # Comma-separated positions
      expect(page).to have_content(team.name)
    end
  end

  context 'PS-004: BBRef Link' do
    let(:player_with_bbref) { create(:player, bbrefid: 'troutmi01') }

    it 'shows BBRef icon that opens Baseball Reference page in new tab' do
      visit player_path(player_with_bbref)

      bbref_link = find('[data-testid="bbref-link"]')
      expect(bbref_link[:target]).to eq('_blank')
      expect(bbref_link[:href]).to include('baseball-reference.com')
      expect(bbref_link[:href]).to include('troutmi01')
    end
  end

  context 'PS-005 & PS-006: Free Agent Button' do
    it 'displays FREE AGENT - PLACE BID button and redirects to bid placement' do
      visit player_path(free_agent)

      button = find('[data-testid="fa-bid-button"]')
      expect(button).to have_content('FREE AGENT - PLACE BID')
      expect(button[:class]).to include('purple') # or however purple styling is applied

      button.click

      expect(current_path).to eq(bidding_path)
      # Verify player is highlighted or search is pre-filled
    end
  end

  context 'PS-007 & PS-008: Trade Eligible Button' do
    let(:trade_eligible_player) { create(:player, :trade_eligible, team: team) }

    it 'displays UNDER CONTRACT - INITIATE TRADE button and redirects to trade builder' do
      visit player_path(trade_eligible_player)

      button = find('[data-testid="trade-button"]')
      expect(button).to have_content('UNDER CONTRACT - INITIATE TRADE')
      expect(button[:class]).to include('green')

      button.click

      expect(current_path).to eq(trade_path)
      expect(page).to have_css("[data-player-id='#{trade_eligible_player.id}']")
    end
  end

  context 'PS-009 & PS-010: Not Trade Eligible' do
    let(:ineligible_player) { create(:player, :recently_acquired, team: team) }

    it 'shows NOT TRADE ELIGIBLE badge with ineligibility reason' do
      visit player_path(ineligible_player)

      badge = find('[data-testid="trade-ineligible-badge"]')
      expect(badge).to have_content('NOT TRADE ELIGIBLE')
      expect(badge[:class]).to include('gray')

      expect(page).to have_content('Just acquired via trade')
    end
  end

  context 'PS-011 & PS-012: Current Contract and History' do
    let!(:current_contract) { create(:contract, :active, player: player, team: team, amount: 75_000, start_year: 2026, end_year: 2028) }
    let!(:old_contract) { create(:contract, :expired, player: player, amount: 50_000, start_year: 2024, end_year: 2025) }

    it 'displays current contract with formatted salary and years' do
      visit player_path(player)

      within('[data-testid="current-contract"]') do
        expect(page).to have_content(team.name)
        expect(page).to have_content('$75,000')
        expect(page).to have_content('2026 - 2028')
      end
    end

    it 'displays contract history sorted by date with ACTIVE tag' do
      visit player_path(player)

      within('[data-testid="contract-history"]') do
        contracts = all('[data-testid="contract-item"]')
        expect(contracts.length).to eq(2)

        # Most recent first (current contract)
        within(contracts[0]) do
          expect(page).to have_content('ACTIVE')
          expect(page).to have_content('2026')
        end

        # Older contract
        within(contracts[1]) do
          expect(page).not_to have_content('ACTIVE')
          expect(page).to have_content('2024')
        end
      end
    end
  end

  context 'PS-015: Position Player Stats' do
    let!(:player_stats) { create(:player_stat, player: player, year: 2025, data: position_player_stats_data) }

    it 'displays position player stats in table format' do
      visit player_path(player)

      within('[data-testid="stats-2025"]') do
        expect(page).to have_content('PA')
        expect(page).to have_content('AB')
        expect(page).to have_content('H')
        expect(page).to have_content('HR')
        expect(page).to have_content('R')
        expect(page).to have_content('RBI')
        expect(page).to have_content('BA')
        expect(page).to have_content('OBP')
        expect(page).to have_content('SLG')
        expect(page).to have_content('OPS')
        expect(page).to have_content('WAR')

        # Should NOT show pitching stats
        expect(page).not_to have_content('IP')
        expect(page).not_to have_content('ERA')
      end
    end
  end

  context 'PS-016: Pitcher Stats' do
    let(:pitcher) { create(:player, positions: ['SP']) }
    let!(:pitcher_stats) { create(:player_stat, player: pitcher, year: 2025, data: pitcher_stats_data) }

    it 'displays pitcher stats without batting stats' do
      visit player_path(pitcher)

      within('[data-testid="stats-2025"]') do
        expect(page).to have_content('IP')
        expect(page).to have_content('ERA')
        expect(page).to have_content('W')
        expect(page).to have_content('L')
        expect(page).to have_content('SV')
        expect(page).to have_content('WHIP')
        expect(page).to have_content('WAR')

        # Should NOT show batting stats (or minimal batting stats for pitchers)
        expect(page).not_to have_content('OPS')
      end
    end
  end

  context 'PS-017: Stats Loading' do
    it 'shows spinner and populates stats or shows error message' do
      player_without_cached_stats = create(:player)

      visit player_path(player_without_cached_stats)

      # Should see spinner initially
      expect(page).to have_css('[data-testid="stats-loading"]', wait: 1)

      # After up to 6 seconds, should see either stats or error
      within 6.seconds do
        expect(page).to have_content('No stats available').or have_css('[data-testid="stats-table"]')
      end
    end
  end

  context 'PS-018: Back Navigation' do
    it 'returns to previous page when clicking Back button' do
      visit players_path
      click_link player.name

      click_button 'Back'

      expect(current_path).to eq(players_path)
    end
  end

  context 'PS-022 & PS-023: PlayerName Component' do
    it 'shows avatars and links throughout app' do
      visit bidding_path
      expect(page).to have_css('[data-testid="player-avatar"]')

      visit trade_path
      expect(page).to have_css('[data-testid="player-avatar"]')

      # Click player name should link to detail page
      visit players_path
      within(first('[data-testid="player-row"]')) do
        player_link = find('[data-testid="player-name-link"]')
        player_id = player_link['data-player-id']
        player_link.click

        expect(current_path).to eq(player_path(player_id))
      end
    end
  end

  private

  def position_player_stats_data
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

  def pitcher_stats_data
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
