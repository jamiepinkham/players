module Types
  class QueryType < Types::BaseObject
    field :teams, resolver: Queries::FetchTeams
    field :team, resolver: Queries::FetchTeam
    field :players, resolver: Queries::FetchPlayers
    field :active_players, resolver: Queries::ActivePlayers
    field :player, resolver: Queries::FetchPlayer
    field :player_search, resolver: Queries::SearchPlayers
    field :seasons, resolver: Queries::FetchSeasons
    field :current_season, resolver: Queries::FetchCurrentSeason
    field :trades, resolver: Queries::FetchTrades
    field :completed_trades, resolver: Queries::FetchCompletedTrades
  end
end
