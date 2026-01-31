import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Text,
  TextInput,
  Select,
  DataTable,
  Pagination,
  Anchor,
} from 'grommet';
import { useQuery } from 'graphql-hooks';
import { useAuth } from '../hooks/use_auth';
import CurrencyFormat from 'react-currency-format';
import PlayerName from './PlayerName';

const PLAYERS_QUERY = `
query GetPlayers {
  activePlayers {
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

// Helper function to get contract status for sorting and display
function getContractStatus(player) {
  const hasStats = player.stats && player.stats.length > 0;

  if (player.contract) {
    return 'Under Contract';
  } else if (hasStats) {
    return 'Free Agent';
  } else {
    return 'Ineligible';
  }
}

const AllPlayersListSearch = () => {
  const auth = useAuth();
  const { loading, error, data } = useQuery(PLAYERS_QUERY);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const hasActiveFAPeriod = data?.currentSeason?.activeFreeAgencyPeriod != null;
  const hasTeam = auth?.teamId != null;

  // Debounce search input with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, positionFilter, statusFilter]);

  // Memoize players with lowercased names for efficient filtering
  const playersWithLowerNames = useMemo(() => {
    if (!data?.activePlayers) return [];
    return data.activePlayers.map((player) => ({
      ...player,
      lowerName: player.name.toLowerCase(),
    }));
  }, [data?.activePlayers]);

  const filteredPlayers = useMemo(() => {
    if (!playersWithLowerNames.length) return [];
    const searchLower = search.toLowerCase();

    let filtered = playersWithLowerNames.filter((player) => {
      const nameMatch = player.lowerName.includes(searchLower);
      const positionMatch =
        !positionFilter || !positionFilter.value || player?.position?.match(positionFilter.value);
      const statusMatch =
        !statusFilter || !statusFilter.value || getContractStatus(player) === statusFilter.value;
      return nameMatch && positionMatch && statusMatch;
    });

    return filtered;
  }, [playersWithLowerNames, search, positionFilter, statusFilter]);

  // Paginate filtered results
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPlayers.slice(startIndex, endIndex);
  }, [filteredPlayers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);

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

  if (loading) return <Text>Loading players...</Text>;
  if (error) return <Text color="status-critical">Error: {error.message}</Text>;

  return (
    <Box fill pad="medium" overflow="auto">
      <Box direction="row" gap="small" margin={{ bottom: 'small' }}>
        <TextInput
          placeholder="Search by name"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <Select
          placeholder="All Positions"
          options={uniquePositions}
          value={positionFilter}
          onChange={({ option }) => setPositionFilter(option)}
          clear
          onClear={() => setPositionFilter('')}
        />
        <Select
          placeholder="All Statuses"
          options={statusOptions}
          value={statusFilter}
          onChange={({ option }) => setStatusFilter(option)}
          clear
          onClear={() => setStatusFilter('')}
        />
      </Box>

      <Box direction="row" justify="between" align="center" margin={{ bottom: 'small' }}>
        <Text size="small" color="dark-4">
          Showing {paginatedPlayers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
          {Math.min(currentPage * itemsPerPage, filteredPlayers.length)} of {filteredPlayers.length} players
        </Text>
        {totalPages > 1 && (
          <Pagination
            numberItems={filteredPlayers.length}
            page={currentPage}
            step={itemsPerPage}
            onChange={({ page }) => setCurrentPage(page)}
          />
        )}
      </Box>

      <DataTable
        columns={[
          {
            property: 'name',
            header: <Text weight="bold">Name</Text>,
            primary: true,
            render: (player) => <PlayerName name={player.name} bbrefid={player.bbrefid} bold />,
          },
          {
            property: 'position',
            header: <Text weight="bold">Position</Text>,
            render: (player) => <Text>{player.position}</Text>,
          },
          {
            property: 'contract',
            header: <Text weight="bold">Contract Status</Text>,
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
            header: <Text weight="bold">Action</Text>,
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
        data={paginatedPlayers}
        background={{
          body: ['white', 'light-1'],
        }}
      />

      {totalPages > 1 && (
        <Box align="center" margin={{ top: 'medium' }}>
          <Pagination
            numberItems={filteredPlayers.length}
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
