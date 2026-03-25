class FetchPlayerImageJob < ApplicationJob
  queue_as :default

  def perform(bbrefid)
    return if bbrefid.blank?

    cache_key = "player_image:#{bbrefid}"

    # Skip if already cached
    return if Rails.cache.exist?(cache_key)

    # Fetch image URL
    url = fetch_from_pybaseball(bbrefid)

    # Cache the result
    Rails.cache.write(cache_key, url, expires_in: PlayerImageService::CACHE_EXPIRY)
  rescue => e
    Rails.logger.error("Failed to fetch image for #{bbrefid}: #{e.message}")
    Rails.cache.write(cache_key, PlayerImageService::DEFAULT_IMAGE, expires_in: PlayerImageService::CACHE_EXPIRY)
  end

  private

  def fetch_from_pybaseball(bbrefid)
    script_path = Rails.root.join('lib', 'scripts', 'get_player_image.py')
    result = `python3 #{script_path} #{bbrefid} 2>&1`.strip

    # Check if the command succeeded and returned a valid URL
    if $?.success? && result.present? && result.start_with?('http')
      result
    else
      Rails.logger.warn("Failed to fetch image for #{bbrefid}: #{result}")
      PlayerImageService::DEFAULT_IMAGE
    end
  end
end
