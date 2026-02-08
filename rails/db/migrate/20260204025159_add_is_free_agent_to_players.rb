class AddIsFreeAgentToPlayers < ActiveRecord::Migration[8.1]
  def up
    # Add column with default false
    add_column :players, :is_free_agent, :boolean, default: false, null: false
    add_index :players, :is_free_agent

    # Seed using current logic: no contract + has stats for current season
    season = Season.current
    return unless season || season.target_stat_year.blank?

    puts "Validating free agents against pybaseball stats for #{season.target_stat_year}..."

    # Get players with active contracts (exclude these)
    player_ids_with_contracts = Contract
      .where(active: true)
      .where('first_season_id <= ?', season.id)
      .where('last_season_id >= ?', season.id)
      .pluck(:player_id)

    # Get all players without contracts
    players_without_contracts = Player
      .where.not(id: player_ids_with_contracts)
      .where.not(bbrefid: [nil, ''])

    # Verify each player has stats in pybaseball for target year
    free_agent_ids = []
    players_without_contracts.find_each do |player|
      if Player.has_stats_in_pybaseball?(player.bbrefid, season.target_stat_year, player.position)
        free_agent_ids << player.id
      end
    end

    # Set flag to true only for validated players
    Player.where(id: free_agent_ids).update_all(is_free_agent: true)

    puts "Set is_free_agent = true for #{free_agent_ids.count} players (validated via pybaseball stats)"
  end

  def down
    remove_index :players, :is_free_agent
    remove_column :players, :is_free_agent
  end
end
