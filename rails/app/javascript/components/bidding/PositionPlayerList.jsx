import React, { useState, useEffect } from "react";
import { Button, DataTable, Spinner, Box, TextInput, Select, Text, Pagination } from "grommet";
import { Search, FormClose, User, Ascend, Descend } from "grommet-icons";

import { useQuery } from "graphql-hooks";

import PositionPlayerStatsTable from "./PositionPlayerStatsTable";
import EmptyState from "../common/EmptyState";

const POSITION_PLAYER_LIST_QUERY = `
  query PositionPlayerListQuery($position: String!, $teamId: ID!, $page: Int!, $perPage: Int!, $search: String, $sortBy: String, $sortDirection: String) {
    players(position: $position, page: $page, perPage: $perPage, search: $search, sortBy: $sortBy, sortDirection: $sortDirection) {
        players {
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
        totalCount
        totalPages
        currentPage
    }
    currentSeason {
      activeFreeAgencyPeriod {
        allBids: bids(active: true) {
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

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
    setCurrentPage(1);
  }, [position]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDirection]);

  const { data = { players: null }, refetch: refetchPlayers } = useQuery(
    POSITION_PLAYER_LIST_QUERY,
    {
      variables: {
        position,
        teamId,
        page: currentPage,
        perPage: itemsPerPage,
        search: searchTerm || null,
        sortBy: sortBy,
        sortDirection: sortDirection,
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

  if (!data.players) return (
    <Box align="center" justify="center" style={{ minHeight: "400px" }}>
      <Spinner size="medium" />
    </Box>
  );

  const { players, totalCount, totalPages } = data.players;

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

  // Calculate display range
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  return (
    <Box gap="small">
      <Box direction="row" align="center" gap="small">
        <Box
          background="white"
          round="small"
          border={{ color: "border", size: "small" }}
          flex
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
        <Text weight="bold">Sort by:</Text>
        <Box width={{ min: "100px" }} background="white" round="xsmall" border={{ color: "border", size: "small" }}>
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
      {playersWithBids.length === 0 ? (
        <EmptyState
          icon={User}
          title={searchTerm ? "No players found" : "No free agents"}
          message={searchTerm ? `No ${position} players match "${searchTerm}"` : `No ${position} players are currently available`}
        />
      ) : (
        <>
          <Box direction="row" justify="between" align="center" pad={{ vertical: 'small' }}>
            <Text size="small" color="dark-4">
              Showing {startIndex + 1}-{endIndex} of {totalCount} players
            </Text>
            {totalPages > 1 && (
              <Pagination
                numberItems={totalCount}
                page={currentPage}
                step={itemsPerPage}
                onChange={({ page }) => setCurrentPage(page)}
              />
            )}
          </Box>
          <PositionPlayerStatsTable
            players={playersWithBids}
            position={position}
            onPlayerSelected={onPlayerSelected}
            showContractAccordion={true}
            includeBidLink={true}
            teamId={teamId}
          />
        </>
      )}
    </Box>
  );
}
