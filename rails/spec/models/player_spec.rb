# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Player, type: :model do
  describe 'BD-002: Positions Array Migration' do
    it 'stores positions as an array' do
      player = create(:player, positions: ['SS', '2B'])

      expect(player.positions).to be_an(Array)
      expect(player.positions).to eq(['SS', '2B'])
    end

    it 'does not have old position field' do
      player = create(:player)

      expect(player).not_to respond_to(:position)
    end
  end

  describe 'BD-004 & BD-005: Free Agent Status' do
    context 'with active contract' do
      it 'sets is_free_agent to false' do
        player = create(:player)
        create(:contract, :active, player: player)

        expect(player.reload.is_free_agent).to be false
      end
    end

    context 'without active contract' do
      it 'sets is_free_agent to true' do
        player = create(:player)

        expect(player.is_free_agent).to be true
      end
    end
  end

  describe 'BD-006 & BD-007: Auto Update Free Agent Status' do
    let(:player) { create(:player) }
    let(:contract) { create(:contract, :active, player: player) }

    it 'updates to true when contract is deactivated' do
      expect(player.reload.is_free_agent).to be false

      contract.update(active: false)

      expect(player.reload.is_free_agent).to be true
    end

    it 'updates to false when new active contract is created' do
      player.update(is_free_agent: true)

      create(:contract, :active, player: player)

      expect(player.reload.is_free_agent).to be false
    end
  end

  describe 'Trade Eligibility' do
    context 'BD-016: isTradeEligible' do
      it 'returns true for eligible player' do
        player = create(:player, :trade_eligible)

        expect(player.trade_eligible?).to be true
      end

      it 'returns false for recently acquired player' do
        player = create(:player, :recently_acquired)

        expect(player.trade_eligible?).to be false
      end
    end

    context 'BD-017: tradeIneligibilityReason' do
      it 'returns reason for ineligible player' do
        player = create(:player, :recently_acquired)

        expect(player.trade_ineligibility_reason).to eq('Just acquired via trade')
      end

      it 'returns nil for eligible player' do
        player = create(:player, :trade_eligible)

        expect(player.trade_ineligibility_reason).to be_nil
      end
    end
  end

  describe 'Player Stats' do
    let(:player) { create(:player) }

    context 'PS-025 & PS-026: Stats API' do
      it 'returns array of stat objects for available year' do
        create(:player_stat, player: player, year: 2025, data: { 'HR' => 35, 'RBI' => 100 })

        stats = player.stats_for_year(2025)

        expect(stats).to be_an(Array)
        expect(stats).not_to be_empty
        expect(stats.first).to have_key('HR')
      end

      it 'returns empty array for unavailable year' do
        stats = player.stats_for_year(1999)

        expect(stats).to eq([])
      end
    end

    context 'PS-027 & PS-028: Available Stat Years' do
      it 'returns array of years with stats data' do
        create(:player_stat, player: player, year: 2024)
        create(:player_stat, player: player, year: 2025)

        years = player.available_stat_years

        expect(years).to eq([2025, 2024]) # Most recent first
      end

      it 'only includes years with actual data' do
        create(:player_stat, player: player, year: 2025, data: { 'HR' => 35 })

        years = player.available_stat_years

        expect(years).to eq([2025])
        expect(years).not_to include(2024)
      end
    end
  end
end
