# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Contract, type: :model do
  let(:team) { create(:team) }
  let(:player) { create(:player) }

  describe 'BD-018: Home Team Discount' do
    context 'when re-signing player' do
      before do
        create(:contract, :expired_last_season, player: player, team: team, amount: 50_000)
      end

      it 'applies 15% discount to contract amount' do
        contract = Contract.create(
          player: player,
          team: team,
          amount: 100_000,
          start_year: Season.current.year,
          end_year: Season.current.year + 2,
          active: true
        )

        expect(contract.amount).to eq(85_000) # 15% discount applied
      end

      it 'respects league minimum floor' do
        contract = Contract.create(
          player: player,
          team: team,
          amount: Season.current.league_minimum,
          start_year: Season.current.year,
          end_year: Season.current.year + 1,
          active: true
        )

        expect(contract.amount).to be >= Season.current.league_minimum
      end
    end

    context 'when signing new player' do
      it 'does not apply discount' do
        contract = Contract.create(
          player: player,
          team: team,
          amount: 100_000,
          start_year: Season.current.year,
          end_year: Season.current.year + 2,
          active: true
        )

        expect(contract.amount).to eq(100_000)
      end
    end

    context 'when player switches teams' do
      before do
        other_team = create(:team)
        create(:contract, :expired_last_season, player: player, team: other_team, amount: 50_000)
      end

      it 'does not apply discount' do
        contract = Contract.create(
          player: player,
          team: team,
          amount: 100_000,
          start_year: Season.current.year,
          end_year: Season.current.year + 2,
          active: true
        )

        expect(contract.amount).to eq(100_000)
      end
    end

    context 'when contract expired 2+ seasons ago' do
      before do
        create(:contract, player: player, team: team, amount: 50_000,
                          start_year: Season.current.year - 4,
                          end_year: Season.current.year - 3,
                          active: false)
      end

      it 'does not apply discount' do
        contract = Contract.create(
          player: player,
          team: team,
          amount: 100_000,
          start_year: Season.current.year,
          end_year: Season.current.year + 2,
          active: true
        )

        expect(contract.amount).to eq(100_000)
      end
    end
  end

  describe 'BD-019: Contract Callbacks - Free Agent Update' do
    it 'updates player free agent status on contract save' do
      player.update(is_free_agent: true)

      Contract.create(
        player: player,
        team: team,
        amount: 100_000,
        start_year: Season.current.year,
        end_year: Season.current.year + 2,
        active: true
      )

      expect(player.reload.is_free_agent).to be false
    end

    it 'updates player free agent status on contract destroy' do
      contract = create(:contract, :active, player: player, team: team)
      expect(player.reload.is_free_agent).to be false

      contract.destroy

      expect(player.reload.is_free_agent).to be true
    end

    it 'updates player free agent status when contract becomes inactive' do
      contract = create(:contract, :active, player: player, team: team)
      expect(player.reload.is_free_agent).to be false

      contract.update(active: false)

      expect(player.reload.is_free_agent).to be true
    end
  end

  describe 'validations' do
    it 'requires player' do
      contract = build(:contract, player: nil)

      expect(contract).not_to be_valid
      expect(contract.errors[:player]).to include("can't be blank")
    end

    it 'requires team' do
      contract = build(:contract, team: nil)

      expect(contract).not_to be_valid
      expect(contract.errors[:team]).to include("can't be blank")
    end

    it 'requires amount to be positive' do
      contract = build(:contract, amount: -1000)

      expect(contract).not_to be_valid
      expect(contract.errors[:amount]).to include('must be greater than 0')
    end

    it 'validates start_year is before end_year' do
      contract = build(:contract, start_year: 2026, end_year: 2025)

      expect(contract).not_to be_valid
      expect(contract.errors[:end_year]).to include('must be after start year')
    end
  end
end
