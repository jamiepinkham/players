module Queries
  class FetchCurrentUser < Queries::BaseQuery
    type Types::UserType, null: true

    def resolve
      context[:current_user]
    end
  end
end
