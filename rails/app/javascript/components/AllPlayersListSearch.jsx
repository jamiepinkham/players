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
import { useAuth } from '../hooks/use_auth';
import CurrencyFormat from 'react-currency-format';
import PlayerName from './PlayerName';
import LoadingState from './LoadingState';
import { DATA_TABLE_THEME } from '../constants/ui';

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
      position
      bbrefStats
      stats {
        title
        value
      }
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
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState('asc');
  const itemsPerPage = 25;
  const searchInputRef = useRef(null);
  const wasFocused = useRef(false);

  // Debounce search input with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Clear name search when position or status filters change
  useEffect(() => {
    setSearchInput('');
    setSearch('');
  }, [positionFilter, statusFilter]);

  // Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, positionFilter, statusFilter, sortDirection]);

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
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
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

  if (loading) return <LoadingState message="Loading players..." />;
  if (error) return <Text color="status-critical">Error: {error.message}</Text>;

  return (
    <Box fill pad="medium" overflow="auto">
      <Box direction="row" gap="small" margin={{ bottom: 'small' }}>
        <TextInput
          ref={searchInputRef}
          placeholder="Search by name"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onFocus={() => wasFocused.current = true}
          onBlur={() => wasFocused.current = false}
        />
        <Select
          placeholder="All Positions"
          options={uniquePositions}
          value={positionFilter}
          onChange={({ option }) => setPositionFilter(option || '')}
          clear
        />
        <Select
          placeholder="All Statuses"
          options={statusOptions}
          value={statusFilter}
          onChange={({ option }) => setStatusFilter(option || '')}
          clear
        />
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
            onChange={({ page }) => setCurrentPage(page)}
          />
        )}
      </Box>

      <Box round="small" overflow="hidden" border={{ color: "border", size: "xsmall" }}>
        <DataTable
          columns={[
          {
            property: 'name',
            header: renderSortableHeader('Name'),
            primary: true,
            render: (player) => <PlayerName name={player.name} bbrefid={player.bbrefid} bold />,
          },
          {
            property: 'position',
            header: "Position",
            render: (player) => <Text>{player.position}</Text>,
          },
          {
            property: 'contract',
            header: "Contract Status",
            align: 'end',
            render: (player) => {
              const hasStats = player.stats && player.stats.length > 0;

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
              } else if (hasStats) {
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
              const hasStats = player.stats && player.stats.length > 0;

              if (!hasTeam) {
                return <Text color="dark-5">N/A</Text>;
              }

              if (player.contract) {
                return <Anchor href={`/trade?player_id=${player.id}`} label="Trade" />;
              } else if (hasStats && hasActiveFAPeriod) {
                return <Anchor href={`/bidding?player_id=${player.id}`} label="Bid" />;
              } else if (hasStats && !hasActiveFAPeriod) {
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
            onChange={({ page }) => setCurrentPage(page)}
          />
        </Box>
      )}
    </Box>
  );
};

export default AllPlayersListSearch;
