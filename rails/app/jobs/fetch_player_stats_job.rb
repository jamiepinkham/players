class FetchPlayerStatsJob < ApplicationJob
  queue_as :default

  def perform(bbrefid, year)
    return if bbrefid.blank? || year.blank?

    cache_key = "player_stats:#{bbrefid}:#{year}"

    # Skip if already cached
    return if Rails.cache.exist?(cache_key)

    # Fetch stats
    stats = StatsFetcher.fetch_from_pybaseball(bbrefid, year)

    # Cache the result
    Rails.cache.write(cache_key, stats, expires_in: StatsFetcher::CACHE_EXPIRY)
  rescue => e
    Rails.logger.error("Failed to fetch stats for #{bbrefid} (#{year}): #{e.message}")
    Rails.cache.write(cache_key, {}, expires_in: StatsFetcher::CACHE_EXPIRY)
  end
end
