class Season < ApplicationRecord
    include Enumerable
    has_many :free_agency_periods, dependent: :destroy
    # i did this high
    has_one :next_season, class_name: 'Season', foreign_key: 'previous_season_id'
    has_one :previous_season, class_name: 'Season', foreign_key: 'next_season_id'

    def self.current
        return Season.where(is_active: true).first
    end

    def active_free_agency_period
        free_agency_periods.where(is_active: true).first || free_agency_periods.first_or_create do |fa|
            fa.start_date = s.start_date
            fa.end_date = s.end_date
            fa.season = s
            fa.max_contract_length = 1
            fa.max_bids_for_team = 1
            fa.is_active = true
        end
    end

    def each(&block)
        if block_given?
            block.call(self)
            self.next_season.each(&block) if self.next_season != nil
        else
            to_enum(:each)
        end
    end
end
