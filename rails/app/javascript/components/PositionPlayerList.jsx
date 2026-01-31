import React from "react";
import { Button, DataTable, Spinner } from "grommet";

import { useQuery } from "graphql-hooks";

import PositionPlayerStatsTable from "./PositionPlayerStatsTable";

const POSITION_PLAYER_LIST_QUERY = `
  query PositionPlayerListQuery($position: String!) {
    players(position: $position) {
        id
        name
        bids(leading: true) {
            annualAmount
            lastSeason {
                name
            }
            team { 
              name
            }
        }
        bbrefid
        position
        stats {
            title
            value
        }
    }
  }
`;

export default function PositionPlayerList({ position, onPlayerSelected, searchTerm = "" }) {
  const { data = { players: null }, refetch: refetchPlayers } = useQuery(
    POSITION_PLAYER_LIST_QUERY,
    {
      variables: {
        position,
      },
    }
  );

  let { players } = data;
  if (!players) return <Spinner size="medium" alignSelf="center" />;

  // Filter players by search term
  const filteredPlayers = searchTerm
    ? players.filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : players;

  return (
    <PositionPlayerStatsTable
      players={filteredPlayers}
      position={position}
      onPlayerSelected={onPlayerSelected}
      includeBidLink={true}
      includeLeadingBid={true}
    />
  );
}
