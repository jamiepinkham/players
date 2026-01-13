module Queries
    class FetchTeams < Queries::BaseQuery
        type [Types::TeamType], null: false

        def resolve
            Team.all
                .includes(:contracts)
                .includes(:user)
                .order(created_at: :desc)
        end
    end
    class FetchTeam < Queries::BaseQuery
        type Types::TeamType, null: true 
        argument :id, ID, required: true

        def resolve(id:)
            Team.includes(:contracts)
                .includes(:user)
                .find(id)

        end
    end
end