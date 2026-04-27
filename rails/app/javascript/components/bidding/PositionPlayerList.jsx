import React, { useState, useEffect } from "react";
import { Button, DataTable, Spinner, Box, TextInput, Select, Text, Pagination } from "grommet";
import { Search, FormClose, User, Ascend, Descend } from "grommet-icons";
import { useSearchParams } from "react-router-dom";

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
            positions
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
  const [searchParams, setSearchParams] = useSearchParams();
  const itemsPerPage = 25;

  const defaultSortStat = position === "SP" || position === "RP" ? "IP" : "PA";

  // Read state from URL params with defaults
  const searchTerm = searchParams.get("search") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const sortBy = searchParams.get("sortBy") || defaultSortStat;
  const sortDirection = searchParams.get("sortDir") || "desc";

  // Helper to update URL params
  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  // Define sortable stats based on position
  const sortableStats = position === "SP" || position === "RP"
    ? ["IP", "ERA", "W", "L", "SV"]
    : ["PA", "HR", "R", "RBI", "BA", "OPS"];

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
    updateParams({ sortBy: newDefaultSort, page: "1" });
  }, [position]);

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

  // Extract data with fallbacks for loading state
  const players = data.players?.players || [];
  const totalCount = data.players?.totalCount || 0;
  const totalPages = data.players?.totalPages || 0;
  const isLoading = !data.players;

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
            onChange={(event) => updateParams({ search: event.target.value, page: "1" })}
            icon={<Search />}
            plain
          />
        </Box>
        {searchTerm && (
          <Button
            icon={<FormClose />}
            onClick={() => updateParams({ search: "", page: "1" })}
            tip="Clear search"
          />
        )}
        <Text weight="bold">Sort by:</Text>
        <Box width={{ min: "100px" }} background="white" round="xsmall" border={{ color: "border", size: "small" }}>
          <Select
            plain
            options={sortableStats}
            value={sortBy}
            onChange={({ option }) => updateParams({ sortBy: option, page: "1" })}
          />
        </Box>
        <Button
          icon={sortDirection === "desc" ? <Descend /> : <Ascend />}
          onClick={() => updateParams({ sortDir: sortDirection === "desc" ? "asc" : "desc" })}
          tip={sortDirection === "desc" ? "Descending" : "Ascending"}
        />
      </Box>
      {isLoading ? (
        <Box align="center" justify="center" style={{ minHeight: "400px" }}>
          <Spinner size="medium" />
        </Box>
      ) : playersWithBids.length === 0 ? (
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
                onChange={({ page }) => updateParams({ page: page.toString() })}
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
