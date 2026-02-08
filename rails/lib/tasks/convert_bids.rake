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
end