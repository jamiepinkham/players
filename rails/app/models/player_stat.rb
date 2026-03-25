class PlayerStat < ApplicationRecord
  belongs_to :player
  belongs_to :season

  validates :player_id, uniqueness: { scope: :season_id }

  # Fetch or create stats for a player in a given season
  def self.fetch_or_create_for(player, season)
    return nil if player.bbrefid.blank? || season.target_stat_year.blank?

    find_or_create_by(player: player, season: season) do |player_stat|
      # Fetch stats from StatsFetcher (uses Redis cache, synchronous for DB record creation)
      stats_hash = StatsFetcher.fetch_for_player(player, season.target_stat_year, async: false)
      player_stat.stats = stats_hash || {}
    end
  end

  # Get a specific stat value
  def [](stat_name)
    stats&.[](stat_name.to_s)
  end

  # Check if this player stat has any actual stats data
  def has_stats?
    stats.present? && stats.any?
  end

end
