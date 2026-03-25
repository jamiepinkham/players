namespace :player_images do
  desc "Pre-warm player image cache for all players"
  task warm_cache: :environment do
    puts "Warming player image cache..."

    total = Player.count
    processed = 0
    failed = 0

    Player.find_each do |player|
      next if player.bbrefid.blank?

      begin
        url = PlayerImageService.image_url_for(player.bbrefid)
        processed += 1
        print "." if processed % 10 == 0
      rescue => e
        failed += 1
        puts "\nFailed for #{player.name} (#{player.bbrefid}): #{e.message}"
      end
    end

    puts "\n\nDone!"
    puts "Processed: #{processed}/#{total}"
    puts "Failed: #{failed}" if failed > 0
    puts "Cache warmed for 7 days"
  end

  desc "Clear player image cache"
  task clear_cache: :environment do
    puts "Clearing player image cache..."

    Player.find_each do |player|
      next if player.bbrefid.blank?
      Rails.cache.delete("player_image:#{player.bbrefid}")
      print "."
    end

    puts "\nDone!"
  end
end
