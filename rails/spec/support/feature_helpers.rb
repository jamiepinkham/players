# frozen_string_literal: true

module FeatureHelpers
  # Helper to select a trade partner from the dropdown
  def select_trade_partner(team)
    click_button 'Select trade partner'
    click_link team.name
  end

  # Helper to drag a player between zones
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

  # Helper to wait for stats to load
  def wait_for_stats_load(timeout: 6)
    within(timeout) do
      expect(page).to have_css('[data-testid="stats-table"]').or have_content('No stats available')
    end
  end

  # Helper for position player stats data
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

  # Helper for pitcher stats data
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

RSpec.configure do |config|
  config.include FeatureHelpers, type: :feature
end
