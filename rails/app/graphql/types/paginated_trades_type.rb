# frozen_string_literal: true

module Types
  class PaginatedTradesType < Types::BaseObject
    description "Paginated list of trades with metadata"

    field :trades, [Types::TradeType], null: false, description: "List of trades for the current page"
    field :total_count, Integer, null: false, description: "Total number of trades"
    field :total_pages, Integer, null: false, description: "Total number of pages"
    field :current_page, Integer, null: false, description: "Current page number"
    field :per_page, Integer, null: false, description: "Number of items per page"
  end
end
