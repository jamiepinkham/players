# frozen_string_literal: true

require 'open3'
require 'json'

# Service class to fetch player statistics from pybaseball/FanGraphs
# Uses Redis caching to avoid repeated Python subprocess calls
class StatsFetcher
  CACHE_EXPIRY = 24.hours

  class << self
    # Main entry point: fetch stats for a player in a given year
    # Returns a hash of stats (same format as PlayerStat.stats)
    # Uses Redis cache to avoid repeated Python calls
    #
    # @param player [Player] The player to fetch stats for
    # @param year [Integer] The year to fetch stats for
    # @param async [Boolean] If true, queue background fetch and return empty hash on cache miss
    # @return [Hash] Stats hash with keys like 'WAR', 'HR', 'RBI', etc.
    def fetch_for_player(player, year, async: true)
      return {} if player.bbrefid.blank?

      cache_key = "player_stats:#{player.bbrefid}:#{year}"

      # Check if cached
      cached_stats = Rails.cache.read(cache_key)
      return cached_stats if cached_stats

      # Check database before falling back to slow API
      # This prevents spinners when cache expires but database has stats
      season = Season.find_by(target_stat_year: year)
      if season
        player_stat = PlayerStat.find_by(player: player, season: season)
        if player_stat&.stats&.any?
          # Found in database - write to cache and return
          Rails.cache.write(cache_key, player_stat.stats, expires_in: CACHE_EXPIRY)
          return player_stat.stats
        end
      end

      # If async mode, queue background job and return empty hash
      if async
        FetchPlayerStatsJob.perform_later(player.bbrefid, year)
        return {}
      end

      # Synchronous fallback (for rake tasks, etc.)
      Rails.cache.fetch(cache_key, expires_in: CACHE_EXPIRY) do
        fetch_from_pybaseball(player.bbrefid, year)
      end
    end

    # Fetch stats directly from pybaseball without caching
    # Useful for cache warming or forced refresh
    #
    # @param bbrefid [String] The Baseball Reference ID
    # @param year [Integer] The year to fetch stats for
    # @return [Hash] Stats hash
    def fetch_from_pybaseball(bbrefid, year)
      python_script = Rails.root.join('lib', 'scripts', 'fetch_mlb_stats.py')

      # Set environment to ensure UTF-8 encoding
      env = { 'PYTHONIOENCODING' => 'utf-8', 'LC_ALL' => 'en_US.UTF-8' }

      # Run Python script with bbrefid filter
      stdout, stderr, status = Open3.capture3(
        env, 'python3', python_script.to_s, year.to_s, bbrefid
      )

      # Ensure stdout is read as UTF-8
      stdout.force_encoding('UTF-8')

      unless status.success?
        Rails.logger.error("Failed to fetch stats for #{bbrefid} (#{year}): #{stderr}")
        return {}
      end

      # Parse JSON output
      begin
        fg_data = JSON.parse(stdout)
        batting_stats = fg_data['batting'] || {}
        pitching_stats = fg_data['pitching'] || {}

        # Extract stats for this specific player
        batting_data = batting_stats[bbrefid]
        pitching_data = pitching_stats[bbrefid]

        # Combine batting and pitching stats
        combine_stats(batting_data, pitching_data)
      rescue JSON::ParserError => e
        Rails.logger.error("Failed to parse stats JSON for #{bbrefid} (#{year}): #{e.message}")
        {}
      end
    end

    # Invalidate the cache for a specific player and year
    # Useful if stats need to be refreshed
    #
    # @param bbrefid [String] The Baseball Reference ID
    # @param year [Integer] The year to invalidate
    def invalidate_cache(bbrefid, year)
      cache_key = "player_stats:#{bbrefid}:#{year}"
      Rails.cache.delete(cache_key)
    end

    private

    # Combine batting and pitching stats into a single hash
    # Logic extracted from import_stats.rake (lines 188-213)
    #
    # @param batting_data [Hash] Hash with 'stats' and 'player_info' keys
    # @param pitching_data [Hash] Hash with 'stats' and 'player_info' keys
    # @return [Hash] Combined stats hash
    def combine_stats(batting_data, pitching_data)
      batting = batting_data&.dig('stats')
      pitching = pitching_data&.dig('stats')

      combined_stats = {}

      if batting
        combined_stats.merge!(batting)
      end

      if pitching
        # For two-way players, keep batting stats and only add pitching-specific fields
        if batting
          pitching_only = pitching.slice('W', 'L', 'ERA', 'GS', 'SV', 'IP', 'ER', 'WHIP', 'WAR')

          # Sum WAR for two-way players
          if combined_stats['WAR'] && pitching_only['WAR']
            combined_war = combined_stats['WAR'].to_f + pitching_only['WAR'].to_f
            pitching_only.delete('WAR')
            combined_stats['WAR'] = combined_war.round(1).to_s
          end

          combined_stats.merge!(pitching_only)
        else
          combined_stats.merge!(pitching)
        end
      end

      combined_stats
    end
  end
end
