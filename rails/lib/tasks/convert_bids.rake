namespace :convert_bids do
    desc "converts leading bids > 24 hours old to a contract"
    task convert_leading: :environment do
        Season.current.active_free_agency_period.convert_bids
    end
end