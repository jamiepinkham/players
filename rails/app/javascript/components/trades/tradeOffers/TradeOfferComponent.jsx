import React, { useState, useEffect } from "react";
import { useQuery } from "graphql-hooks";
import { useLocation } from "react-router-dom";
import { Spinner, Accordion, AccordionPanel, Box, Heading, Paragraph } from "grommet";
import { useAuth } from "../../../hooks/use_auth";
import PendingTrades from "../PendingTrades";
import SplitScreenTradeBuilder from "./SplitScreenTradeBuilder";

const TEAMS_QUERY = `
  query TradingConsoleTeamQuery {
    teams {
      id
      name
      budget
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
    data = { teams: null }
  } = useQuery(TEAMS_QUERY);

  const {
    loading: playerLoading,
    data: playerData = { player: null }
  } = useQuery(PLAYER_CONTRACT_QUERY, {
    variables: { playerId },
    skip: !playerId
  });

  // When player data loads, set initial team and contract
  useEffect(() => {
    if (playerData?.player?.contract?.team) {
      setInitialTeam(playerData.player.contract.team);
      setInitialContract(playerData.player.contract);
      // Open the "Propose New Trade" panel
      setActiveIndex([1]);
    }
  }, [playerData]);

  if (!data.teams) return <Spinner size="medium" alignSelf="center" />;
  return (
    <Accordion multiple={true} activeIndex={activeIndex} onActive={(index) => setActiveIndex(index)}>
      <AccordionPanel label='Pending Trades' background='light-2'>
        <PendingTrades />
      </AccordionPanel>
      <AccordionPanel label='Propose New Trade' background='light-2'>
        <SplitScreenTradeBuilder
          teams={data.teams}
          currentTeamId={teamId}
          initialTeamId={initialTeam?.id}
          initialContract={initialContract}
          onTradeSubmitted={() => window.location.reload()}
        />
      </AccordionPanel>
    </Accordion>
  );
}

export default TradeOfferComponent;
