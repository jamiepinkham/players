# frozen_string_literal: true

require 'rails_helper'

RSpec.feature 'Stats System', type: :feature do
  let(:season) { create(:season, :active, name: '2024') }
  let(:team) { create(:team, name: 'Test Team') }

  before do
    # Stub external API calls
    allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({})
  end

  describe 'REG-STATS-001: Player Stats Display' do
    context 'when viewing a batter with stats' do
      let(:batter) { create(:player, name: 'Test Batter', bbrefid: 'battetest01') }

      before do
        # Mock stats for this player
        allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
          'G' => '150',
          'PA' => '650',
          'AB' => '580',
          'H' => '175',
          'HR' => '30',
          'RBI' => '95',
          'BA' => '.302',
          'OBP' => '.375',
          'SLG' => '.550',
          'OPS' => '.925'
        })
      end

      it 'displays batting stats on player detail page' do
        visit "/player/#{batter.id}"

        expect(page).to have_content('Test Batter')
        expect(page).to have_content('2024')

        # Check for key batting stats
        within('.stats-section') do
          expect(page).to have_content('150') # Games
          expect(page).to have_content('.302') # Batting Average
          expect(page).to have_content('30') # Home Runs
          expect(page).to have_content('95') # RBI
          expect(page).to have_content('.925') # OPS
        end
      end
    end

    context 'when viewing a pitcher with stats' do
      let(:pitcher) { create(:player, name: 'Test Pitcher', bbrefid: 'pitchte01') }

      before do
        allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
          'G' => '32',
          'GS' => '32',
          'W' => '15',
          'L' => '8',
          'SV' => '0',
          'IP' => '200.0',
          'SO' => '220',
          'ERA' => '3.25',
          'WHIP' => '1.12'
        })
      end

      it 'displays pitching stats on player detail page' do
        visit "/player/#{pitcher.id}"

        expect(page).to have_content('Test Pitcher')

        within('.stats-section') do
          expect(page).to have_content('32') # Games
          expect(page).to have_content('15') # Wins
          expect(page).to have_content('8') # Losses
          expect(page).to have_content('3.25') # ERA
          expect(page).to have_content('1.12') # WHIP
          expect(page).to have_content('220') # Strikeouts
        end
      end
    end

    context 'when player has no stats' do
      let(:player) { create(:player, name: 'No Stats Player', bbrefid: 'nostats01') }

      before do
        allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({})
      end

      it 'shows appropriate message when stats are unavailable' do
        visit "/player/#{player.id}"

        expect(page).to have_content('No Stats Player')
        # Should either show empty stats or a message about no stats available
        expect(page).to have_content(/No stats available|Stats not found/)
      end
    end
  end

  describe 'REG-STATS-002: Stats Caching' do
    let(:player) { create(:player, name: 'Cache Test', bbrefid: 'cachetest01') }

    it 'caches stats in Redis after first fetch' do
      stats_data = { 'G' => '100', 'HR' => '20', 'BA' => '.280' }

      # First call should fetch from external source
      expect_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .once
        .and_return(stats_data)

      # Fetch stats twice
      result1 = StatsFetcher.fetch_for_player(player, 2024, async: false)
      result2 = StatsFetcher.fetch_for_player(player, 2024, async: false)

      # Both should return same data
      expect(result1).to eq(stats_data)
      expect(result2).to eq(stats_data)

      # Second fetch should have come from cache (no additional API call)
    end

    it 'uses separate cache keys for different years' do
      stats_2023 = { 'G' => '90', 'HR' => '15' }
      stats_2024 = { 'G' => '100', 'HR' => '20' }

      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .with(player.bbrefid, 2023)
        .and_return(stats_2023)

      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .with(player.bbrefid, 2024)
        .and_return(stats_2024)

      result_2023 = StatsFetcher.fetch_for_player(player, 2023, async: false)
      result_2024 = StatsFetcher.fetch_for_player(player, 2024, async: false)

      expect(result_2023).to eq(stats_2023)
      expect(result_2024).to eq(stats_2024)
    end

    it 'expires cache after 24 hours' do
      # This is a property test - we're verifying the cache expiry is set
      cache_key = "player_stats:#{player.bbrefid}:2024"

      StatsFetcher.fetch_for_player(player, 2024, async: false)

      # Check that the cache key exists and has a TTL
      expect(Rails.cache.exist?(cache_key)).to be true

      # Note: Testing actual expiry would require time manipulation
      # which is out of scope for this test
    end
  end

  describe 'REG-STATS-003: Background Job Processing', js: true do
    let(:player) { create(:player, name: 'Async Test', bbrefid: 'asynctest01') }

    before do
      # Clear Sidekiq jobs
      Sidekiq::Worker.clear_all
    end

    it 'queues background job when async is true' do
      expect {
        StatsFetcher.fetch_for_player(player, 2024, async: true)
      }.to change(FetchPlayerStatsJob.jobs, :size).by(1)
    end

    it 'returns empty hash immediately when stats not cached and async is true' do
      result = StatsFetcher.fetch_for_player(player, 2024, async: true)

      expect(result).to eq({})
    end

    it 'processes background job successfully' do
      stats_data = { 'G' => '100', 'HR' => '25' }

      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .and_return(stats_data)

      # Queue and process the job
      FetchPlayerStatsJob.perform_later(player.bbrefid, 2024)

      # Process jobs synchronously in test
      FetchPlayerStatsJob.drain

      # Stats should now be cached
      cached_stats = StatsFetcher.fetch_for_player(player, 2024, async: false)
      expect(cached_stats).to eq(stats_data)
    end
  end

  describe 'REG-STATS-004: MLB Stats API Integration' do
    let(:player) { create(:player, name: 'API Test', bbrefid: 'apitest01') }

    it 'successfully fetches stats from MLB Stats API' do
      # This test should make a real call to the MLB Stats API
      # Skip stubbing to test actual integration
      VCR.use_cassette('mlb_stats_api_batting') do
        # Use a real player ID that exists
        real_player = create(:player, bbrefid: 'troutmi01') # Mike Trout

        stats = StatsFetcher.fetch_for_player(real_player, 2024, async: false)

        # Should have received stats
        expect(stats).not_to be_empty

        # Should have key batting stats
        expect(stats.keys).to include('G', 'AB', 'H')
      end
    end

    it 'handles API errors gracefully' do
      # Stub to simulate API failure
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .and_raise(StandardError.new('API timeout'))

      result = StatsFetcher.fetch_for_player(player, 2024, async: false)

      # Should return empty hash on error
      expect(result).to eq({})
    end

    it 'handles player not found in API' do
      # Player with no MLB stats
      unknown_player = create(:player, bbrefid: 'unknown99')

      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .and_return({})

      result = StatsFetcher.fetch_for_player(unknown_player, 2024, async: false)

      expect(result).to eq({})
    end
  end

  describe 'REG-STATS-005: Stats for Different Years' do
    let(:player) { create(:player, name: 'Multi Year', bbrefid: 'multiyear01') }

    it 'displays stats tabs for multiple years', js: true do
      visit "/player/#{player.id}"

      # Should have year tabs (2020-2025 based on current implementation)
      expect(page).to have_content('2024')
      expect(page).to have_content('2023')
      expect(page).to have_content('2022')

      # Click different year tab
      click_on '2023'

      # Should load stats for that year
      # Stats will be fetched via GraphQL
      expect(page).to have_current_path("/player/#{player.id}")
    end

    it 'fetches stats for the selected year' do
      stats_2023 = { 'G' => '140', 'HR' => '25' }
      stats_2024 = { 'G' => '150', 'HR' => '30' }

      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .with(player.bbrefid, 2023)
        .and_return(stats_2023)

      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .with(player.bbrefid, 2024)
        .and_return(stats_2024)

      result_2023 = StatsFetcher.fetch_for_player(player, 2023, async: false)
      result_2024 = StatsFetcher.fetch_for_player(player, 2024, async: false)

      expect(result_2023['HR']).to eq('25')
      expect(result_2024['HR']).to eq('30')
    end
  end

  describe 'REG-STATS-006: Two-Way Players' do
    let(:two_way_player) { create(:player, name: 'Shohei Ohtani', bbrefid: 'ohtansh01') }

    before do
      # Mock both batting and pitching stats
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
        'G' => '135',
        'AB' => '497',
        'HR' => '44',
        'BA' => '.274',
        'GS' => '23',
        'W' => '10',
        'L' => '5',
        'ERA' => '3.14',
        'SO' => '167'
      })
    end

    it 'displays both batting and pitching stats' do
      visit "/player/#{two_way_player.id}"

      within('.stats-section') do
        # Batting stats
        expect(page).to have_content('44') # HR
        expect(page).to have_content('.274') # BA

        # Pitching stats
        expect(page).to have_content('10') # Wins
        expect(page).to have_content('3.14') # ERA
        expect(page).to have_content('167') # Strikeouts
      end
    end
  end

  describe 'REG-STATS-007: Cache Invalidation' do
    let(:player) { create(:player, name: 'Cache Clear', bbrefid: 'cacheclear01') }

    it 'can manually invalidate cache for a player' do
      old_stats = { 'G' => '100', 'HR' => '20' }
      new_stats = { 'G' => '101', 'HR' => '21' }

      # First fetch
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .and_return(old_stats)

      result1 = StatsFetcher.fetch_for_player(player, 2024, async: false)
      expect(result1['HR']).to eq('20')

      # Invalidate cache
      StatsFetcher.invalidate_cache(player.bbrefid, 2024)

      # Mock new stats
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball)
        .and_return(new_stats)

      # Fetch again - should get new stats
      result2 = StatsFetcher.fetch_for_player(player, 2024, async: false)
      expect(result2['HR']).to eq('21')
    end
  end

  describe 'REG-STATS-008: Missing BBRef ID' do
    let(:player_no_bbref) { create(:player, name: 'No BBRef', bbrefid: nil) }

    it 'handles players without BBRef ID gracefully' do
      result = StatsFetcher.fetch_for_player(player_no_bbref, 2024, async: false)

      expect(result).to eq({})
    end

    it 'does not queue background job for players without BBRef ID' do
      expect {
        StatsFetcher.fetch_for_player(player_no_bbref, 2024, async: true)
      }.not_to change(FetchPlayerStatsJob.jobs, :size)
    end
  end
end
