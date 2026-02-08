import React, { useState, useEffect } from "react";
import { Button, DataTable, Spinner, Box, TextInput, Select, Text } from "grommet";
import { Search, FormClose, User, Ascend, Descend } from "grommet-icons";

import { useQuery } from "graphql-hooks";

import PositionPlayerStatsTable from "./PositionPlayerStatsTable";
import EmptyState from "../common/EmptyState";

const POSITION_PLAYER_LIST_QUERY = `
  query PositionPlayerListQuery($position: String!, $teamId: ID!) {
    players(position: $position) {
        id
        name
        bbrefid
        position
        stats {
            title
            value
        }
        contractMinimums {
            season {
                name
                id
            }
            amount
            duration
        }
    }
    currentSeason {
      activeFreeAgencyPeriod {
        allBids: bids(active: true, leading: true) {
          id
          player {
            id
          }
          team {
            id
            name
          }
          annualAmount
          firstSeason {
            id
            name
          }
          lastSeason {
            name
          }
        }
        myTeamBids: bids(teamId: $teamId, active: true) {
          id
          player {
            id
          }
        }
      }
    }
  }
`;

export default function PositionPlayerList({ position, onPlayerSelected, teamId }) {
  const [searchTerm, setSearchTerm] = useState("");

  const defaultSortStat = position === "SP" || position === "RP" ? "IP" : "PA";
  const [sortBy, setSortBy] = useState(defaultSortStat);
  const [sortDirection, setSortDirection] = useState("desc");

  // Define sortable stats based on position
  const sortableStats = position === "SP" || position === "RP"
    ? ["IP", "ERA", "W", "L", "SV", "WAR"]
    : ["PA", "HR", "R", "RBI", "BA", "OPS", "WAR"];

  const formatPlayerStats = (player) => {
    const stats = {};
    player.stats.forEach(stat => {
      stats[stat.title] = stat.value;
    });
    return stats;
  };

  // Reset sort to default when position changes
  useEffect(() => {
    const newDefaultSort = position === "SP" || position === "RP" ? "IP" : "PA";
    setSortBy(newDefaultSort);
  }, [position]);

  const { data = { players: null }, refetch: refetchPlayers } = useQuery(
    POSITION_PLAYER_LIST_QUERY,
    {
      variables: {
        position,
        teamId,
      },
    }
  );

  // Refetch when a bid is placed
  useEffect(() => {
    const handleBidPlaced = () => {
      refetchPlayers();
    };
    window.addEventListener('bidPlaced', handleBidPlaced);
    return () => {
      window.removeEventListener('bidPlaced', handleBidPlaced);
    };
  }, [refetchPlayers]);

  let { players } = data;
  if (!players) return <Spinner size="medium" alignSelf="center" />;

  // Get all active bids (for displaying) and merge with players
  const allActiveBids = data?.currentSeason?.activeFreeAgencyPeriod?.allBids || [];
  const myTeamBidPlayerIds = new Set(
    (data?.currentSeason?.activeFreeAgencyPeriod?.myTeamBids || []).map(bid => bid.player.id)
  );

  const playersWithBids = players.map(player => ({
    ...player,
    bids: allActiveBids.filter(bid => bid.player.id === player.id),
    hasMyTeamBid: myTeamBidPlayerIds.has(player.id)
  }));

  // Filter players by search term
  let filteredPlayers = searchTerm
    ? playersWithBids.filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : playersWithBids;

  // Sort players based on selected stat
  filteredPlayers = [...filteredPlayers].sort((a, b) => {
    const aStats = formatPlayerStats(a);
    const bStats = formatPlayerStats(b);
    const aValue = parseFloat(aStats[sortBy]) || 0;
    const bValue = parseFloat(bStats[sortBy]) || 0;

    return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
  });

  return (
    <Box gap="small">
      <Box direction="row" justify="end" align="center" gap="small">
        <Box
          background="white"
          round="small"
          border={{ color: "border", size: "small" }}
          style={{ flex: 1 }}
        >
          <TextInput
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            icon={<Search />}
            plain
          />
        </Box>
        {searchTerm && (
          <Button
            icon={<FormClose />}
            onClick={() => setSearchTerm("")}
            tip="Clear search"
          />
        )}
      </Box>
      <Box direction="row" align="center" gap="small" pad="small" background="light-2" round="small" border={{ color: "border", size: "xsmall" }}>
        <Text weight="bold">Sort by:</Text>
        <Box flex background="white" round="xsmall" border={{ color: "border", size: "small" }}>
          <Select
            plain
            options={sortableStats}
            value={sortBy}
            onChange={({ option }) => setSortBy(option)}
          />
        </Box>
        <Button
          icon={sortDirection === "desc" ? <Descend /> : <Ascend />}
          onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
          tip={sortDirection === "desc" ? "Descending" : "Ascending"}
        />
      </Box>
      {filteredPlayers.length === 0 ? (
        <EmptyState
          icon={User}
          title={searchTerm ? "No players found" : "No free agents"}
          message={searchTerm ? `No ${position} players match "${searchTerm}"` : `No ${position} players are currently available`}
        />
      ) : (
        <PositionPlayerStatsTable
          players={filteredPlayers}
          position={position}
          onPlayerSelected={onPlayerSelected}
          showContractAccordion={true}
          includeBidLink={true}
          teamId={teamId}
        />
      )}
    </Box>
  );
}
