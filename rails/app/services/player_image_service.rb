class PlayerImageService
  # Simple placeholder - solid gray circle
  DEFAULT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ccircle cx="100" cy="100" r="100" fill="%23cccccc"/%3E%3C/svg%3E'
  CACHE_EXPIRY = 7.days

  def self.image_url_for(bbrefid)
    return DEFAULT_IMAGE if bbrefid.blank?

    # Check cache first
    cached = Rails.cache.read("player_image:#{bbrefid}")
    return cached if cached

    # Fetch synchronously with timeout
    url = fetch_from_pybaseball(bbrefid)
    Rails.cache.write("player_image:#{bbrefid}", url, expires_in: CACHE_EXPIRY)
    url
  rescue => e
    Rails.logger.error("Failed to fetch image for #{bbrefid}: #{e.message}")
    DEFAULT_IMAGE
  end

  private

  def self.fetch_from_pybaseball(bbrefid)
    script_path = Rails.root.join('lib', 'scripts', 'get_player_image.py')
    result = `python3 #{script_path} #{bbrefid} 2>&1`.strip

    # Check if the command succeeded and returned a valid URL
    if $?.success? && result.present? && result.start_with?('http')
      result
    else
      Rails.logger.warn("Failed to fetch image for #{bbrefid}: #{result}")
      DEFAULT_IMAGE
    end
  end
end
