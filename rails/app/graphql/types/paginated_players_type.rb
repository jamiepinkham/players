# frozen_string_literal: true

module Types
  class PaginatedPlayersType < Types::BaseObject
    description "Paginated list of players with metadata"

    field :players, [Types::PlayerType], null: false, description: "List of players for the current page"
    field :total_count, Integer, null: false, description: "Total number of players matching the filters"
    field :total_pages, Integer, null: false, description: "Total number of pages"
    field :current_page, Integer, null: false, description: "Current page number"
    field :per_page, Integer, null: false, description: "Number of items per page"
    field :has_next_page, Boolean, null: false, description: "Whether there is a next page"
    field :has_previous_page, Boolean, null: false, description: "Whether there is a previous page"
  end
end
