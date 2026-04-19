namespace :convert_bids do
    desc "converts leading bids > 24 hours old to a contract"
    task convert_leading: :environment do
        season = Season.current
        if season.nil?
            puts "No active season found"
            exit 1
        end

        fa_period = season.active_free_agency_period
        if fa_period.nil?
            puts "No free agency period found for season #{season.name}"
            exit 1
        end

        # Check if FA is inactive but has active/leading bids
        unless fa_period.is_active
            active_count = fa_period.bids.active.count
            leading_count = fa_period.bids.leading.count

            if active_count > 0 || leading_count > 0
                puts "⚠️  ALERT: Free agency is inactive but found #{active_count} active bids and #{leading_count} leading bids"
                puts "Sending alert email to admins..."

                begin
                    NotificationMailer.bid_conversion_alert(
                        active_count,
                        leading_count,
                        season.name
                    ).deliver_now
                    puts "Alert email sent successfully"
                rescue => e
                    puts "Failed to send alert email: #{e.message}"
                end

                puts "Aborting bid conversion"
                exit 0
            else
                puts "Free agency is inactive and no bids to process"
                exit 0
            end
        end

        # Run the conversion
        puts "Converting bids for #{season.name}..."
        results = fa_period.convert_bids

        puts "\nBid Conversion Results:"
        puts "  Contracts created: #{results[:contracts_created]}"
        puts "  Bids outbid: #{results[:bids_outbid]}"
        puts "  New leading bids: #{results[:new_leading_bids]}"
        puts "  Email failures: #{results[:email_failures]}"

        # Send summary email to admins
        puts "\nSending summary email to admins..."
        begin
            NotificationMailer.bid_conversion_summary(
                results,
                season.name,
                fa_period.is_active
            ).deliver_now
            puts "Summary email sent successfully"
        rescue => e
            puts "Failed to send summary email: #{e.message}"
        end

        puts "\nDone!"
    end

    desc "preview what would happen if convert_leading ran (dry run)"
    task preview: :environment do
        fap = Season.current.active_free_agency_period

        if fap.nil?
            puts "No active free agency period"
            exit
        end

        puts "="*80
        puts "PREVIEW: Bid Conversion for #{fap.season.name}"
        puts "="*80

        # Get unique player IDs with leading bids
        leading_player_ids = fap.bids.leading.distinct.pluck(:player_id)

        contracts_to_create = []
        bids_to_overtake = []
        new_leading_bids = []

        leading_player_ids.each do |player_id|
            player = Player.find(player_id)
            player_leading_bids = fap.bids.leading.where(player_id: player_id)
            player_active_bids = fap.bids.active.where(player_id: player_id)

            leading_bid = player_leading_bids.max_by(&:total_amount)
            leading_active_bid = player_active_bids.max_by(&:total_amount)

            next unless leading_bid

            if leading_active_bid && leading_active_bid.total_amount > leading_bid.total_amount
                # Active bid will overtake
                bids_to_overtake << {
                    player: player,
                    old_leading: leading_bid,
                    new_leading: leading_active_bid
                }
            else
                # Leading bid will convert to contract
                contracts_to_create << {
                    player: player,
                    bid: leading_bid
                }

                # Find next leading bid after conversion
                next_active = player_active_bids.where.not(id: leading_bid.id).max_by(&:total_amount)
                if next_active
                    new_leading_bids << {
                        player: player,
                        bid: next_active
                    }
                end
            end
        end

        # Display results
        puts "\n📋 CONTRACTS TO BE CREATED: #{contracts_to_create.count}"
        puts "-"*80
        contracts_to_create.each do |item|
            bid = item[:bid]
            puts "\n#{item[:player].name} → #{bid.team.name}"
            puts "  $#{bid.annual_amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}/year × #{bid.contract_length} years = $#{bid.total_amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"
            puts "  #{bid.first_season.name} - #{bid.last_season.name}"
        end

        puts "\n\n⚠️  BIDS THAT WILL OVERTAKE: #{bids_to_overtake.count}"
        puts "-"*80
        bids_to_overtake.each do |item|
            old_bid = item[:old_leading]
            new_bid = item[:new_leading]
            puts "\n#{item[:player].name}"
            puts "  OLD: #{old_bid.team.name} - $#{old_bid.total_amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"
            puts "  NEW: #{new_bid.team.name} - $#{new_bid.total_amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse} ⬆️"
            puts "  (Contract will NOT be created - bid continues)"
        end

        puts "\n\n🆕 NEW LEADING BIDS (after conversions): #{new_leading_bids.count}"
        puts "-"*80
        new_leading_bids.each do |item|
            bid = item[:bid]
            puts "\n#{item[:player].name} → #{bid.team.name}"
            puts "  $#{bid.annual_amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}/year × #{bid.contract_length} years = $#{bid.total_amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"
            puts "  #{bid.first_season.name} - #{bid.last_season.name}"
        end

        puts "\n"
        puts "="*80
        puts "SUMMARY"
        puts "="*80
        puts "Contracts to create: #{contracts_to_create.count}"
        puts "Bids that will overtake: #{bids_to_overtake.count}"
        puts "New leading bids: #{new_leading_bids.count}"
        puts "="*80
    end
end