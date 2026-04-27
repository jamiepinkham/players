import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  TextInput,
  Select,
  DataTable,
  Pagination,
  Anchor,
  Button,
} from 'grommet';
import { FormUp, FormDown } from 'grommet-icons';
import { useManualQuery } from 'graphql-hooks';
import { useAuth } from '../../hooks/use_auth';
import { Link, useSearchParams } from 'react-router-dom';
import CurrencyFormat from 'react-currency-format';
import PlayerName from './PlayerName';
import LoadingState from '../common/LoadingState';
import { DATA_TABLE_THEME } from '../../constants/ui';

const PLAYERS_QUERY = `
query GetPlayersPaginated($page: Int!, $perPage: Int!, $nameSearch: String, $position: String, $status: String, $sortDirection: String) {
  activePlayersPaginated(
    page: $page
    perPage: $perPage
    nameSearch: $nameSearch
    position: $position
    status: $status
    sortDirection: $sortDirection
  ) {
    players {
      id
      bbrefid
      bbrefMinors
      name
      positions
      isFreeAgent
      contract {
        firstSeason { name }
        lastSeason { name }
        active
        franchise
        summer
        amount
        team {
          id
          name
        }
      }
    }
    totalCount
    totalPages
    currentPage
    perPage
    hasNextPage
    hasPreviousPage
  }
  currentSeason {
    id
    name
    activeFreeAgencyPeriod {
      id
      maxBidsForTeam
    }
  }
}
`;

const AllPlayersListSearch = () => {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const itemsPerPage = 25;
  const searchInputRef = useRef(null);
  const wasFocused = useRef(false);

  // Read state from URL params
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || '');
  const search = searchParams.get("search") || '';
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const sortDirection = searchParams.get("sortDir") || 'asc';

  // Position and status filters need to find the matching option object
  const uniquePositions = [
    { label: 'All Positions', value: '' },
    { label: 'SP', value: 'SP' },
    { label: 'RP', value: 'RP' },
    { label: 'C', value: '2' },
    { label: '1B', value: '3' },
    { label: '2B', value: '4' },
    { label: '3B', value: '5' },
    { label: 'SS', value: '6' },
    { label: 'LF', value: '7' },
    { label: 'CF', value: '8' },
    { label: 'RF', value: '9' },
    { label: 'DH', value: 'D' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Under Contract (Tradeable)', value: 'Under Contract' },
    { label: 'Free Agent (Biddable)', value: 'Free Agent' },
    { label: 'Ineligible', value: 'Ineligible' },
  ];

  const positionFilter = uniquePositions.find(p => p.value === searchParams.get("position")) || uniquePositions[0];
  const statusFilter = statusOptions.find(s => s.value === searchParams.get("status")) || statusOptions[0];

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

  // Debounce search input with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput, page: "1" });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Map position filter label to server-side position value
  const getPositionValue = (filter) => {
    if (!filter || !filter.value) return '';
    // Map the filter values to the position values expected by the server
    const positionMap = {
      'SP': 'SP',
      'RP': 'RP',
      '2': 'C',
      '3': '1B',
      '4': '2B',
      '5': '3B',
      '6': 'SS',
      '7': 'OF',
      '8': 'OF',
      '9': 'OF',
      'D': 'DH',
    };
    return positionMap[filter.value] || filter.value;
  };

  const [fetchPlayers, { loading, error, data }] = useManualQuery(PLAYERS_QUERY);

  // Restore focus to search input after data loads if it was focused
  useEffect(() => {
    if (wasFocused.current && searchInputRef.current && !loading) {
      searchInputRef.current.focus();
    }
  }, [loading, data]);

  // Fetch data whenever variables change
  useEffect(() => {
    fetchPlayers({
      variables: {
        page: currentPage,
        perPage: itemsPerPage,
        nameSearch: search,
        position: getPositionValue(positionFilter),
        status: statusFilter?.value || '',
        sortDirection: sortDirection,
      },
    });
  }, [sortDirection, currentPage, search, positionFilter, statusFilter]);

  // Handle column header click for sorting (name only)
  const handleSort = () => {
    updateParams({ sortDir: sortDirection === 'asc' ? 'desc' : 'asc' });
  };

  const hasActiveFAPeriod = data?.currentSeason?.activeFreeAgencyPeriod != null;
  const hasTeam = auth?.teamId != null;

  const players = data?.activePlayersPaginated?.players || [];
  const totalCount = data?.activePlayersPaginated?.totalCount || 0;
  const totalPages = data?.activePlayersPaginated?.totalPages || 0;

  // Helper to render sortable column header (name only)
  const renderSortableHeader = (label) => (
    <Button
      plain
      onClick={handleSort}
      hoverIndicator
    >
      <Box direction="row" align="center" gap="xsmall">
        <Text weight="bold">{label}</Text>
        {sortDirection === 'asc' ? <FormUp size="small" /> : <FormDown size="small" />}
      </Box>
    </Button>
  );

  if (loading) return <LoadingState message="Loading players..." />;
  if (error) return <Text color="status-critical">Error: {error.message}</Text>;

  return (
    <Box gap="small">
      <Box direction="row-responsive" gap="small" margin={{ bottom: 'small' }}>
        <Box flex>
          <TextInput
            ref={searchInputRef}
            placeholder="Search by name"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onFocus={() => wasFocused.current = true}
            onBlur={() => wasFocused.current = false}
          />
        </Box>
        <Box width={{ min: "150px", max: "200px" }}>
          <Select
            placeholder="All Positions"
            options={uniquePositions}
            value={positionFilter}
            onChange={({ option }) => {
              updateParams({ position: option?.value || '', search: '', page: "1" });
              setSearchInput(''); // Clear search input when changing filters
            }}
            clear
          />
        </Box>
        <Box width={{ min: "150px", max: "200px" }}>
          <Select
            placeholder="All Statuses"
            options={statusOptions}
            value={statusFilter}
            onChange={({ option }) => {
              updateParams({ status: option?.value || '', search: '', page: "1" });
              setSearchInput(''); // Clear search input when changing filters
            }}
            clear
          />
        </Box>
      </Box>

      <Box direction="row" justify="between" align="center" margin={{ bottom: 'small' }}>
        <Text size="small" color="dark-4">
          Showing {players.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
          {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} players
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

      <Box round="small" overflow={{ horizontal: "hidden" }} border={{ color: "border", size: "xsmall" }}>
        <DataTable
          columns={[
          {
            property: 'name',
            header: renderSortableHeader('Name'),
            primary: true,
            render: (player) => (
              <PlayerName playerId={player.id} name={player.name} bbrefid={player.bbrefid} bold />
            ),
          },
          {
            property: 'positions',
            header: "Position",
            render: (player) => <Text>{player.positions?.join(', ') || ''}</Text>,
          },
          {
            property: 'contract',
            header: "Contract Status",
            align: 'end',
            render: (player) => {
              if (player.contract) {
                return (
                  <Text>
                    {player.contract.team?.name || 'Unknown'} - <CurrencyFormat
                      value={player.contract.amount}
                      thousandSeparator={true}
                      prefix={'$'}
                      displayType={'text'}
                    /> - Ends: {player.contract.lastSeason?.name || '?'}
                  </Text>
                );
              } else if (player.isFreeAgent) {
                return <Text>Free Agent</Text>;
              } else {
                return <Text color="status-critical">Ineligible</Text>;
              }
            },
          },
          {
            property: 'action',
            header: "Action",
            align: 'end',
            render: (player) => {
              if (!hasTeam) {
                return <Text color="dark-5">N/A</Text>;
              }

              if (player.contract) {
                return <Anchor href={`/trade?player_id=${player.id}`} label="Trade" />;
              } else if (player.isFreeAgent && hasActiveFAPeriod) {
                return <Anchor href={`/bidding?player_id=${player.id}`} label="Bid" />;
              } else if (player.isFreeAgent && !hasActiveFAPeriod) {
                return <Text color="dark-5">Bid (N/A)</Text>;
              } else {
                return <Text color="dark-5">N/A</Text>;
              }
            },
          },
        ]}
        data={players}
        responsive
        background={DATA_TABLE_THEME.background}
        />
      </Box>

      {totalPages > 1 && (
        <Box align="center" margin={{ top: 'medium' }}>
          <Pagination
            numberItems={totalCount}
            page={currentPage}
            step={itemsPerPage}
            onChange={({ page }) => updateParams({ page: page.toString() })}
          />
        </Box>
      )}
    </Box>
  );
};

export default AllPlayersListSearch;
