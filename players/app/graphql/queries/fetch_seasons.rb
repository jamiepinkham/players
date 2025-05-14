module Queries
    class FetchSeasons < Queries::BaseQuery
        type [Types::SeasonType], null: false

        def resolve
            Season.all
        end
    end

    class FetchCurrentSeason < Queries::BaseQuery
        type Types::SeasonType, null: false
        
        def resolve
            Season.current
        end
    end
end