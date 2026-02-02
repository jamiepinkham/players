import React, { useEffect, useState } from "react";
import { useQuery } from "graphql-hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use_auth";
import {
  Heading,
  Box,
  Spinner,
  DataTable,
  Tabs,
  Tab,
  Text,
  Paragraph,
} from "grommet";
import { Currency } from "grommet-icons";

import PlayerLists from "./PlayerLists";
import TeamBudgetInfo from "./TeamBudgetInfo";
import CurrencyFormat from "react-currency-format";
import Moment from "react-moment";
import PlayerName from "./PlayerName";
import EmptyState from "./EmptyState";
import { DATA_TABLE_THEME } from "../constants/ui";

const BIDDING_CONSOLE_QUERY = `
  query BiddingConsoleQuery($teamId: ID!) {
    team(id: $teamId) {
      id
      name
      budget
      currentPayroll
      availableCash
      unsalariedPlayers
      totalPlayers
    }
    currentSeason {
      activeFreeAgencyPeriod {
            id
            maxBidsForTeam
            bids(teamId: $teamId, active: true) {
                id
                isLeading
                createdAt
                player {
                    name
                    bbrefid
                }
                annualAmount
                lastSeason {
                    name
                }
            }
        }
        id
        name
    }
  }
`;

export default function BiddingConsole() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query params
  const searchParams = new URLSearchParams(location.search);
  const playerId = searchParams.get('player_id');

  // Always start on Free Agents tab
  const [activeTab, setActiveTab] = useState(0);

  // Check if user has a team assigned
  if (!auth.teamId) {
    return (
      <Box pad="large" align="center">
        <Heading level={3}>Team Required</Heading>
        <Paragraph textAlign="center">
          You must be assigned to a team to access the bidding feature.
          Please contact your league administrator.
        </Paragraph>
      </Box>
    );
  }

  const { data = { team: null, currentSeason: null }, refetch: refetch } =
    useQuery(BIDDING_CONSOLE_QUERY, {
      variables: {
        teamId: auth.teamId,
      },
    });

  // When player_id is in URL, redirect to place bid page
  useEffect(() => {
    if (playerId && data?.currentSeason?.activeFreeAgencyPeriod) {
      const bids = data.currentSeason.activeFreeAgencyPeriod.bids;
      const maxBids = data.currentSeason.activeFreeAgencyPeriod.maxBidsForTeam;
      if (bids.length < maxBids) {
        navigate(`/bidding/${playerId}/place-bid`, { replace: true });
      }
    }
  }, [playerId, data, navigate]);

  if (!data.team || !data.currentSeason?.activeFreeAgencyPeriod) {
    return <Spinner size="medium" alignSelf="center" />;
  }

  const team = data.team;
  const currentSeason = data.currentSeason;
  const bids = currentSeason.activeFreeAgencyPeriod.bids
  const maxBids = currentSeason.activeFreeAgencyPeriod.maxBidsForTeam

  function onPlayerSelected(player) {
    if (bids.length < maxBids) {
      navigate(`/bidding/${player.id}/place-bid`);
    }
  }

  function handleTabChange(nextIndex) {
    setActiveTab(nextIndex);
  }

  return (
    <Box gap="medium">
      <Box
        pad="small"
        gap="small"
        round="small"
        background="light-1"
        border={{ color: "border", size: "xsmall" }}
        elevation="small"
        flex={false}
      >
        <Heading level={3} margin="none">
          {team.name} Bidding Console
        </Heading>
        <TeamBudgetInfo team={team} />
      </Box>
      <Box round="small" border={{ color: "border", size: "xsmall" }} flex>
        <Tabs activeIndex={activeTab} onActive={handleTabChange}>
          <Tab title="Free Agents">
            <Box pad="small">
              <PlayerLists onPlayerSelected={onPlayerSelected} teamId={auth.teamId} />
            </Box>
          </Tab>
          <Tab title={
            <Box direction="row" align="center" gap="xsmall">
              <Text>Current Bids ({bids.length}/{maxBids})</Text>
              {bids.length > 0 && (
                <Box
                  background="status-critical"
                  round="full"
                  width="8px"
                  height="8px"
                />
              )}
            </Box>
          }>
            <Box pad="small">
              {bids.length > 0 ? (
                <Box round="small" overflow="hidden" border={{ color: "border", size: "xsmall" }}>
                  <DataTable
                    primaryKey="id"
                    columns={[
                    {
                      property: "player.name",
                      header: "Player",
                      render: (bid) => (
                        <PlayerName
                          name={bid.player.name}
                          bbrefid={bid.player.bbrefid}
                        />
                      ),
                    },
                    {
                      property: "amount",
                      header: "Annual Amount",
                      render: (bid) => (
                        <CurrencyFormat
                          value={bid.annualAmount}
                          displayType={"text"}
                          thousandSeparator={true}
                          prefix={"$"}
                        />
                      ),
                    },
                    {
                      property: "lastSeason.name",
                      header: "Final Season",
                    },
                    {
                      property: "createAt",
                      header: "Date placed",
                      render: (bid) => (
                          <Moment fromNow>{bid.createdAt}</Moment>
                      ),
                    },
                    {
                      property: "isLeading",
                      header: "Leading",
                      render: (bid) => (
                        <Text>{bid.isLeading ? "yes" : "no"}</Text>
                      ),
                    },
                  ]}
                  data={bids}
                  responsive
                  background={DATA_TABLE_THEME.background}
                  />
                </Box>
              ) : (
                <EmptyState
                  icon={Currency}
                  title="No bids placed yet"
                  message="Go to Free Agents tab to place your first bid"
                />
              )}
            </Box>
          </Tab>
        </Tabs>
      </Box>
    </Box>
  );
}
