import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'graphql-hooks';
import { Box, Text, Button, Spinner, Anchor } from 'grommet';
import { FormPrevious } from 'grommet-icons';
import PlayerAvatar from './PlayerAvatar';

const PLAYER_DETAIL_QUERY = `
  query PlayerDetail($id: ID!) {
    player(id: $id) {
      id
      name
      bbrefid
      positions
      isFreeAgent
      isTradeEligible
      tradeIneligibilityReason
      team { name }
      contract {
        id
        amount
        firstSeason { name }
        lastSeason { name }
        team { id name }
      }
      contracts {
        id
        amount
        firstSeason { name }
        lastSeason { name }
        active
        team { name }
      }
      availableStatYears
    }
  }
`;

const PLAYER_STATS_QUERY = `
  query PlayerStats($id: ID!, $year: Int!) {
    player(id: $id) {
      stats(year: $year) {
        title
        value
      }
    }
  }
`;

function YearStats({ playerId, year, positions }) {
  const [retryCount, setRetryCount] = React.useState(0);
  const { loading, error, data, refetch } = useQuery(PLAYER_STATS_QUERY, {
    variables: { id: playerId, year }
  });

  // Poll for stats if they're empty (being fetched in background)
  React.useEffect(() => {
    const stats = data?.player?.stats || [];

    // If no error and no stats, retry after delay (max 3 retries)
    if (!loading && !error && stats.length === 0 && retryCount < 3) {
      const timeout = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }, 2000); // Retry every 2 seconds

      return () => clearTimeout(timeout);
    }
  }, [loading, error, data, retryCount, refetch]);

  if (loading) return <div style={{ padding: '16px 0' }}><Spinner size="small" /></div>;
  if (error) {
    console.error(`Error loading ${year} stats:`, error);
    return <div style={{ color: '#999' }}>Unable to load stats</div>;
  }

  const allStats = data?.player?.stats || [];
  if (allStats.length === 0) {
    // Show spinner if we're still retrying
    if (retryCount < 3) {
      return <div style={{ padding: '16px 0' }}><Spinner size="small" /></div>;
    }
    return <div style={{ color: '#999' }}>No stats available for {year}</div>;
  }

  // Determine if player is a pitcher
  const isPitcher = positions?.some(pos => pos === 'SP' || pos === 'RP');

  // Define relevant stats based on position
  const relevantStatKeys = isPitcher
    ? ['IP', 'ERA', 'W', 'L', 'SV', 'WHIP', 'WAR']
    : ['PA', 'AB', 'H', 'HR', 'R', 'RBI', 'BA', 'OBP', 'SLG', 'OPS', 'WAR'];

  // Filter stats to only show relevant ones
  const stats = allStats.filter(stat => relevantStatKeys.includes(stat.title));

  if (stats.length === 0) {
    return <div style={{ color: '#999' }}>No relevant stats available for {year}</div>;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {stats.map((stat, idx) => (
              <th key={idx} style={{
                fontSize: '12px',
                fontWeight: 'normal',
                color: '#666',
                textAlign: 'left',
                padding: '4px 16px 4px 0',
                width: `${100 / stats.length}%`
              }}>
                {stat.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {stats.map((stat, idx) => (
              <td key={idx} style={{
                fontSize: '16px',
                fontWeight: 'bold',
                padding: '4px 16px 4px 0'
              }}>
                {stat.value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function PlayerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { loading, error, data } = useQuery(PLAYER_DETAIL_QUERY, {
    variables: { id }
  });

  if (loading) return <Box pad="large"><Spinner size="large" /></Box>;
  if (error) return <Box pad="large"><Text>Error: {error.message}</Text></Box>;

  const player = data?.player;
  if (!player) return <Box pad="large"><Text>Player not found</Text></Box>;

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Button icon={<FormPrevious />} label="Back" onClick={() => navigate(-1)} plain />
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '48px' }}>
        <PlayerAvatar bbrefid={player.bbrefid} size="large" name={player.name} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '32px' }}>{player.name}</h1>
            {player.bbrefid && (
              <Anchor
                href={`https://www.baseball-reference.com/players/${player.bbrefid[0].toLowerCase()}/${player.bbrefid}.shtml`}
                target="_blank"
                rel="noopener noreferrer"
                title="View on Baseball Reference"
              >
                <img
                  src="https://www.baseball-reference.com/favicon.ico"
                  alt="Baseball Reference"
                  style={{ width: '24px', height: '24px' }}
                />
              </Anchor>
            )}
          </div>
          <div style={{ fontSize: '18px', marginTop: '4px' }}>{player.positions?.join(', ')}</div>
          {player.team && <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>{player.team.name}</div>}

          {player.isFreeAgent ? (
            <Link to={`/bidding/${player.id}/place-bid`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'inline-block',
                marginTop: '8px',
                padding: '6px 14px',
                backgroundColor: '#7D4CDB',
                color: 'white',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6C3FCB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7D4CDB'}
              >
                FREE AGENT - PLACE BID
              </div>
            </Link>
          ) : player.contract && (
            player.isTradeEligible ? (
              <Link
                to={`/trade?player_id=${player.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '6px 14px',
                  backgroundColor: '#00873D',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00742F'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00873D'}
                >
                  UNDER CONTRACT - INITIATE TRADE
                </div>
              </Link>
            ) : (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  backgroundColor: '#CCCCCC',
                  color: '#666666',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'not-allowed',
                  opacity: 0.7
                }}>
                  UNDER CONTRACT - NOT TRADE ELIGIBLE
                </div>
                {player.tradeIneligibilityReason && (
                  <div style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#FF4040',
                    fontWeight: '500'
                  }}>
                    {player.tradeIneligibilityReason}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {player.contract && (
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Current Contract</h2>
          <div style={{ marginLeft: '16px' }}>
            <div style={{ marginBottom: '8px' }}>Team: {player.contract.team?.name}</div>
            <div style={{ marginBottom: '8px' }}>Salary: ${player.contract.amount?.toLocaleString()}</div>
            <div>Years: {player.contract.firstSeason?.name} - {player.contract.lastSeason?.name}</div>
          </div>
        </div>
      )}

      {player.contracts?.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Contract History</h2>
          <div style={{ marginLeft: '16px' }}>
            {player.contracts.map((contract) => (
              <div key={contract.id} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold' }}>{contract.team?.name}</div>
                <div>${contract.amount?.toLocaleString()}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {contract.firstSeason?.name} - {contract.lastSeason?.name}
                  {contract.active && <span style={{ color: '#7D4CDB', marginLeft: '8px' }}>ACTIVE</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {player.availableStatYears?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Career Stats</h2>
          {player.availableStatYears.map((year) => (
            <div key={year} style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{year} Season</h3>
              <YearStats playerId={player.id} year={year} positions={player.positions} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
