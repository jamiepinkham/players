class PlayerStat < ApplicationRecord
  belongs_to :player
  belongs_to :season

  validates :player_id, uniqueness: { scope: :season_id }

  # Get a specific stat value
  def [](stat_key)
    stats[stat_key]
  end

  # Set a specific stat value
  def []=(stat_key, value)
    stats[stat_key] = value
  end

  # Check if player is a pitcher (has pitching stats)
  def pitcher?
    stats['IP'].present? || stats['ERA'].present?
  end

  # Check if player is a batter (has batting stats)
  def batter?
    stats['PA'].present? || stats['AB'].present?
  end

  # Get WAR value as float
  def war
    stats['WAR']&.to_f || 0.0
  end
end
