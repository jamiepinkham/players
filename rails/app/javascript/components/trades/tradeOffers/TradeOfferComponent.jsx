import React, { useState, useEffect } from "react";
import { useQuery } from "graphql-hooks";
import { useLocation } from "react-router-dom";
import { Spinner, Tabs, Tab, Box, Heading, Paragraph, Text } from "grommet";
import { useAuth } from "../../../hooks/use_auth";
import PendingTrades from "../PendingTrades";
import ClickTradeBuilder from "./ClickTradeBuilder";

const TEAMS_QUERY = `
  query TradingConsoleTeamQuery($teamId: ID!) {
    teams {
      id
      name
      budget
    }
    trades(team: $teamId) {
      id
    }
  }
`;

const PLAYER_CONTRACT_QUERY = `
  query PlayerContractQuery($playerId: ID!) {
    player(id: $playerId) {
      id
      name
      bbrefid
      position
      isTradeEligible
      contract {
        id
        amount
        active
        firstSeason { id name }
        lastSeason { id name }
        team {
          id
          name
        }
        player {
          id
          name
          bbrefid
          position
          isTradeEligible
        }
      }
    }
  }
`;

function TradeOfferComponent() {
  const { teamId } = useAuth();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [initialTeam, setInitialTeam] = useState(null);
  const [initialContract, setInitialContract] = useState(null);

  // Check if user has a team assigned
  if (!teamId) {
    return (
      <Box pad="large" align="center">
        <Heading level={3}>Team Required</Heading>
        <Paragraph textAlign="center">
          You must be assigned to a team to access the trade feature.
          Please contact your league administrator.
        </Paragraph>
      </Box>
    );
  }

  // Parse query params for player_id
  const searchParams = new URLSearchParams(location.search);
  const playerId = searchParams.get('player_id');

  const {
    loading,
    error,
    data = { teams: null, trades: [] },
    refetch
  } = useQuery(TEAMS_QUERY, {
    variables: { teamId }
  });

  const {
    loading: playerLoading,
    data: playerData = { player: null }
  } = useQuery(PLAYER_CONTRACT_QUERY, {
    variables: { playerId },
    skip: !playerId
  });

  // Listen for trade updates to refresh pending trades count
  useEffect(() => {
    const handleTradeUpdate = () => {
      refetch();
    };
    window.addEventListener('tradeUpdated', handleTradeUpdate);
    return () => {
      window.removeEventListener('tradeUpdated', handleTradeUpdate);
    };
  }, [refetch]);

  // When player data loads, set initial team and contract
  useEffect(() => {
    if (playerData?.player?.contract?.team) {
      setInitialTeam(playerData.player.contract.team);
      setInitialContract(playerData.player.contract);
      // "Propose New Trade" tab is index 1
      setActiveIndex(1);
    }
  }, [playerData]);

  if (!data.teams) return <Spinner size="medium" alignSelf="center" />;

  const pendingTradesCount = data.trades?.length || 0;

  return (
    <Box>
      <Box>
        <Tabs
          activeIndex={activeIndex}
          onActive={(index) => setActiveIndex(index)}
          justify="start"
        >
          <Tab title={
            <Box direction="row" align="center" gap="xsmall">
              <Text>Pending Trades</Text>
              {pendingTradesCount > 0 && (
                <Box
                  background="status-critical"
                  round="full"
                  width="8px"
                  height="8px"
                />
              )}
            </Box>
          }>
            <Box pad="medium">
              <PendingTrades />
            </Box>
          </Tab>
          <Tab title='Propose New Trade'>
            <Box pad={{ top: "medium" }}>
              <ClickTradeBuilder
                teams={data.teams}
                currentTeamId={teamId}
                initialTeamId={initialTeam?.id}
                initialContract={initialContract}
                onTradeSubmitted={() => window.location.reload()}
              />
            </Box>
          </Tab>
        </Tabs>
      </Box>
    </Box>
  );
}

export default TradeOfferComponent;
