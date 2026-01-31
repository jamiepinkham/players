import React, { useState } from "react";
import { Button, DataTable, Spinner, Box, TextInput } from "grommet";
import { Search, FormClose } from "grommet-icons";

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

export default function PositionPlayerList({ position, onPlayerSelected }) {
  const [searchTerm, setSearchTerm] = useState("");

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
    <Box>
      <Box direction="row" justify="end" align="center" gap="small" margin={{ bottom: "small" }}>
        <TextInput
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          icon={<Search />}
        />
        {searchTerm && (
          <Button
            icon={<FormClose />}
            onClick={() => setSearchTerm("")}
            tip="Clear search"
          />
        )}
      </Box>
      <PositionPlayerStatsTable
        players={filteredPlayers}
        position={position}
        onPlayerSelected={onPlayerSelected}
        includeBidLink={true}
        includeLeadingBid={true}
      />
    </Box>
  );
}
