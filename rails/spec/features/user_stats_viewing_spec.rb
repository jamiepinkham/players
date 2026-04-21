# frozen_string_literal: true

require 'rails_helper'

RSpec.feature 'User Stats Viewing', type: :feature, js: true do
  let(:season) { create(:season, :active, name: '2024') }
  let(:team) { create(:team, name: 'Test Team') }
  let(:user) { create(:user) }

  before do
    # Mock stats API to avoid external calls
    allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({})
  end

  describe 'UAT-STATS-001: Viewing Batter Stats' do
    let(:batter) do
      create(:player,
        name: 'Mike Trout',
        bbrefid: 'troutmi01',
        positions: ['OF']
      )
    end

    before do
      # Mock realistic batting stats
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
        'G' => '150',
        'PA' => '650',
        'AB' => '580',
        'H' => '175',
        '2B' => '35',
        '3B' => '5',
        'HR' => '30',
        'R' => '105',
        'RBI' => '95',
        'SB' => '15',
        'BB' => '65',
        'SO' => '145',
        'BA' => '.302',
        'OBP' => '.375',
        'SLG' => '.550',
        'OPS' => '.925'
      })
    end

    scenario 'User views batting stats for a player' do
      # GIVEN a user is viewing a batter's profile
      visit "/player/#{batter.id}"

      # THEN they should see the player's name
      expect(page).to have_content('Mike Trout')

      # AND they should see the 2024 season stats
      within('.stats-section') do
        # Games played
        expect(page).to have_content('150')

        # Batting average
        expect(page).to have_content('.302')

        # Home runs
        expect(page).to have_content('30')

        # RBI
        expect(page).to have_content('95')

        # OPS
        expect(page).to have_content('.925')

        # On-base percentage
        expect(page).to have_content('.375')

        # Slugging percentage
        expect(page).to have_content('.550')
      end

      # AND they should see offensive counting stats
      within('.stats-section') do
        expect(page).to have_content('175') # Hits
        expect(page).to have_content('35')  # Doubles
        expect(page).to have_content('5')   # Triples
        expect(page).to have_content('105') # Runs
        expect(page).to have_content('15')  # Stolen bases
        expect(page).to have_content('65')  # Walks
        expect(page).to have_content('145') # Strikeouts
      end
    end

    scenario 'User sees appropriate labels for batting stats' do
      visit "/player/#{batter.id}"

      within('.stats-section') do
        # Verify stat labels are clear and readable
        expect(page).to have_content(/Games|G/)
        expect(page).to have_content(/Batting Average|BA|AVG/)
        expect(page).to have_content(/Home Runs|HR/)
        expect(page).to have_content(/RBI/)
        expect(page).to have_content(/OPS/)
      end
    end
  end

  describe 'UAT-STATS-002: Viewing Pitcher Stats' do
    let(:pitcher) do
      create(:player,
        name: 'Jacob deGrom',
        bbrefid: 'degroja01',
        positions: ['SP']
      )
    end

    before do
      # Mock realistic pitching stats
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
        'G' => '32',
        'GS' => '32',
        'W' => '15',
        'L' => '8',
        'SV' => '0',
        'IP' => '200.0',
        'H' => '150',
        'R' => '65',
        'ER' => '60',
        'HR' => '18',
        'BB' => '45',
        'SO' => '245',
        'ERA' => '2.70',
        'WHIP' => '0.98'
      })
    end

    scenario 'User views pitching stats for a starter' do
      # GIVEN a user is viewing a pitcher's profile
      visit "/player/#{pitcher.id}"

      # THEN they should see the player's name
      expect(page).to have_content('Jacob deGrom')

      # AND they should see pitching statistics
      within('.stats-section') do
        # Games and starts
        expect(page).to have_content('32') # Games

        # Win-loss record
        expect(page).to have_content('15') # Wins
        expect(page).to have_content('8')  # Losses

        # Innings pitched
        expect(page).to have_content('200.0')

        # ERA
        expect(page).to have_content('2.70')

        # WHIP
        expect(page).to have_content('0.98')

        # Strikeouts
        expect(page).to have_content('245')

        # Walks
        expect(page).to have_content('45')

        # Hits allowed
        expect(page).to have_content('150')
      end
    end

    scenario 'User sees appropriate labels for pitching stats' do
      visit "/player/#{pitcher.id}"

      within('.stats-section') do
        expect(page).to have_content(/ERA/)
        expect(page).to have_content(/WHIP/)
        expect(page).to have_content(/Wins|W/)
        expect(page).to have_content(/Losses|L/)
        expect(page).to have_content(/Strikeouts|SO|K/)
      end
    end
  end

  describe 'UAT-STATS-003: Viewing Relief Pitcher Stats' do
    let(:closer) do
      create(:player,
        name: 'Craig Kimbrel',
        bbrefid: 'kimbrcr01',
        positions: ['RP']
      )
    end

    before do
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
        'G' => '65',
        'GS' => '0',
        'W' => '5',
        'L' => '3',
        'SV' => '35',
        'IP' => '60.0',
        'H' => '40',
        'R' => '18',
        'ER' => '15',
        'HR' => '5',
        'BB' => '20',
        'SO' => '80',
        'ERA' => '2.25',
        'WHIP' => '1.00'
      })
    end

    scenario 'User views relief pitcher stats with saves' do
      visit "/player/#{closer.id}"

      expect(page).to have_content('Craig Kimbrel')

      within('.stats-section') do
        # Relief pitchers have 0 starts
        expect(page).to have_content('0') # Games started

        # But many games pitched
        expect(page).to have_content('65')

        # Saves are key for closers
        expect(page).to have_content('35') # Saves

        # Other stats
        expect(page).to have_content('2.25') # ERA
        expect(page).to have_content('80')   # Strikeouts
      end
    end
  end

  describe 'UAT-STATS-004: Viewing Two-Way Player Stats' do
    let(:two_way) do
      create(:player,
        name: 'Shohei Ohtani',
        bbrefid: 'ohtansh01',
        positions: ['DH', 'SP']
      )
    end

    before do
      # Mock combined batting and pitching stats
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
        # Batting
        'G' => '135',
        'PA' => '550',
        'AB' => '497',
        'H' => '136',
        'HR' => '44',
        'R' => '95',
        'RBI' => '95',
        'BA' => '.274',
        'OBP' => '.356',
        'SLG' => '.592',
        'OPS' => '.948',
        # Pitching
        'GS' => '23',
        'W' => '10',
        'L' => '5',
        'IP' => '132.0',
        'SO' => '167',
        'ERA' => '3.14',
        'WHIP' => '1.05'
      })
    end

    scenario 'User sees both batting and pitching stats for two-way player' do
      visit "/player/#{two_way.id}"

      expect(page).to have_content('Shohei Ohtani')

      within('.stats-section') do
        # Batting stats
        expect(page).to have_content('44')   # HR
        expect(page).to have_content('.274') # BA
        expect(page).to have_content('.948') # OPS

        # Pitching stats
        expect(page).to have_content('10')   # Wins
        expect(page).to have_content('3.14') # ERA
        expect(page).to have_content('167')  # SO
      end
    end
  end

  describe 'UAT-STATS-005: Switching Between Years' do
    let(:player) do
      create(:player,
        name: 'Multi Year Player',
        bbrefid: 'multiyear01'
      )
    end

    before do
      # Mock different stats for different years
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball) do |_, bbrefid, year|
        case year
        when 2024
          { 'G' => '150', 'HR' => '30', 'BA' => '.300' }
        when 2023
          { 'G' => '140', 'HR' => '25', 'BA' => '.285' }
        when 2022
          { 'G' => '135', 'HR' => '20', 'BA' => '.270' }
        else
          {}
        end
      end
    end

    scenario 'User switches between different years to view stats' do
      visit "/player/#{player.id}"

      # Default to 2024
      within('.stats-section') do
        expect(page).to have_content('30') # 2024 HR
        expect(page).to have_content('.300')
      end

      # Click 2023 tab
      click_on '2023'

      # Stats should update
      within('.stats-section') do
        expect(page).to have_content('25') # 2023 HR
        expect(page).to have_content('.285')
      end

      # Click 2022 tab
      click_on '2022'

      # Stats should update again
      within('.stats-section') do
        expect(page).to have_content('20') # 2022 HR
        expect(page).to have_content('.270')
      end
    end

    scenario 'User sees year tabs for available years' do
      visit "/player/#{player.id}"

      # Should show tabs for recent years (based on implementation)
      expect(page).to have_link('2024')
      expect(page).to have_link('2023')
      expect(page).to have_link('2022')
      expect(page).to have_link('2021')
      expect(page).to have_link('2020')
    end
  end

  describe 'UAT-STATS-006: No Stats Available' do
    let(:rookie) do
      create(:player,
        name: 'New Rookie',
        bbrefid: 'rookiene01'
      )
    end

    before do
      # No stats available
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({})
    end

    scenario 'User views player with no stats and sees appropriate message' do
      visit "/player/#{rookie.id}"

      expect(page).to have_content('New Rookie')

      # Should see some indication that stats aren't available
      # This could be empty tables, a message, or placeholder text
      within('.stats-section') do
        expect(page).to have_content(/No stats|Stats not available|No data/i)
          .or(have_selector('.stats-table:empty'))
          .or(have_content('0')) # Or zeros for all stats
      end
    end
  end

  describe 'UAT-STATS-007: Stats Loading State' do
    let(:player) do
      create(:player,
        name: 'Loading Test',
        bbrefid: 'loadtest01'
      )
    end

    scenario 'User sees loading indicator while stats are being fetched' do
      # Simulate slow API response
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball) do
        sleep(0.5)
        { 'G' => '100', 'HR' => '20' }
      end

      visit "/player/#{player.id}"

      # Should see loading indicator initially
      expect(page).to have_selector('.loading, .spinner, [data-loading="true"]')
        .or(have_content(/Loading|Fetching/i))

      # Wait for stats to load
      expect(page).to have_content('100', wait: 2)
    end
  end

  describe 'UAT-STATS-008: Stats Comparison Across Players' do
    let(:player_a) do
      create(:player, name: 'Player A', bbrefid: 'playera01')
    end

    let(:player_b) do
      create(:player, name: 'Player B', bbrefid: 'playerb01')
    end

    before do
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball) do |_, bbrefid, _year|
        case bbrefid
        when 'playera01'
          { 'G' => '150', 'HR' => '40', 'BA' => '.320', 'RBI' => '120' }
        when 'playerb01'
          { 'G' => '145', 'HR' => '25', 'BA' => '.290', 'RBI' => '85' }
        end
      end
    end

    scenario 'User compares stats between two players' do
      # View first player
      visit "/player/#{player_a.id}"

      within('.stats-section') do
        expect(page).to have_content('40')  # HR
        expect(page).to have_content('.320') # BA
      end

      # Navigate to second player
      visit "/player/#{player_b.id}"

      within('.stats-section') do
        expect(page).to have_content('25')  # HR
        expect(page).to have_content('.290') # BA
      end
    end
  end

  describe 'UAT-STATS-009: Stats While Logged Out' do
    let(:player) { create(:player, name: 'Public Player', bbrefid: 'public01') }

    before do
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
        'G' => '130', 'HR' => '22', 'BA' => '.275'
      })
    end

    scenario 'Unauthenticated user can view player stats' do
      # Don't sign in
      visit "/player/#{player.id}"

      # Should still be able to see stats
      expect(page).to have_content('Public Player')

      within('.stats-section') do
        expect(page).to have_content('130')
        expect(page).to have_content('22')
        expect(page).to have_content('.275')
      end
    end
  end

  describe 'UAT-STATS-010: Stats Refresh' do
    let(:player) { create(:player, name: 'Refresh Test', bbrefid: 'refresh01') }

    scenario 'User can refresh player page to get updated stats' do
      # Initial stats
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
        'HR' => '20'
      })

      visit "/player/#{player.id}"

      within('.stats-section') do
        expect(page).to have_content('20')
      end

      # Update mock to return new stats
      allow_any_instance_of(StatsFetcher).to receive(:fetch_from_pybaseball).and_return({
        'HR' => '21'
      })

      # Clear cache to force refresh
      StatsFetcher.invalidate_cache(player.bbrefid, 2024)

      # Refresh page
      visit "/player/#{player.id}"

      # Should see updated stats (if cache was cleared)
      # Note: In production, this would require cache expiry or manual invalidation
      within('.stats-section') do
        expect(page).to have_content('21')
      end
    end
  end
end
