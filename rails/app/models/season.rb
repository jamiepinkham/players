class Season < ApplicationRecord
    include Enumerable
    has_many :free_agency_periods, dependent: :destroy

    # Season linking - only need one direction, can traverse both ways
    belongs_to :previous_season, class_name: 'Season', optional: true
    has_one :next_season, class_name: 'Season', foreign_key: 'previous_season_id'

    def self.current
        Season.where(is_active: true).first
    end

    # Enumerate through all seasons starting from the current one
    def self.each_from_current(&block)
        return [] unless current
        current.each(&block)
    end

    def active_free_agency_period
        free_agency_periods.where(is_active: true).first || free_agency_periods.first_or_create do |fa|
            fa.start_date = self.start_date
            fa.end_date = self.end_date
            fa.season = self
            fa.max_contract_length = 1
            fa.max_bids_for_team = 1
            fa.is_active = true
        end
    end

    def each(&block)
        return to_enum(:each) unless block_given?

        season = self
        visited = Set.new

        while season && !visited.include?(season.id)
            visited.add(season.id)
            block.call(season)
            season = season.next_season
        end

        self
    end

    # Count the number of seasons from this season to the target season (inclusive)
    def count_seasons_to(target_season)
        return 0 if target_season.nil?
        return 1 if self.id == target_season.id

        count = 0
        season = self
        visited = Set.new

        while season && !visited.include?(season.id)
            visited.add(season.id)
            count += 1
            break if season.id == target_season.id
            season = season.next_season
        end

        count
    end
end
