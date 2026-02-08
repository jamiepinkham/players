import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "graphql-hooks";
import { useAuth } from "../../hooks/use_auth";
import { Box, Heading, Spinner, Button, Text } from "grommet";
import { Previous, FormUp, FormDown } from "grommet-icons";
import PlaceBidComponent from "./PlaceBidComponent";
import PlayerName from "../players/PlayerName";
import CurrencyFormat from "react-currency-format";

const PLAYER_QUERY = `
  query PlayerQuery($playerId: ID!) {
    player(id: $playerId) {
      id
      name
      bbrefid
      position
      bbrefLink
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
      bids {
        id
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
    }
  }
`;

export default function PlaceBid() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    loading: playerLoading,
    data: playerData = { player: null }
  } = useQuery(PLAYER_QUERY, {
    variables: { playerId },
    skip: !playerId
  });

  if (!auth.teamId) {
    return (
      <Box pad="large" align="center">
        <Heading level={3}>Team Required</Heading>
        <p>You must be assigned to a team to place bids.</p>
      </Box>
    );
  }

  if (playerLoading) {
    return (
      <Box pad="large" align="center">
        <Spinner size="medium" />
      </Box>
    );
  }

  if (!playerData?.player) {
    return (
      <Box pad="large" align="center">
        <Heading level={3}>Player Not Found</Heading>
        <Button label="Go Back" onClick={() => navigate(-1)} />
      </Box>
    );
  }

  const player = playerData.player;

  const formatPlayerStats = (player) => {
    const stats = {};
    player.stats.forEach(stat => {
      stats[stat.title] = stat.value;
    });
    return stats;
  };

  const stats = formatPlayerStats(player);
  const isPitcher = player.position === "SP" || player.position === "RP";

  return (
    <Box gap="small">
      <Box
        round="small"
        overflow="hidden"
        border={{ color: "border", size: "xsmall" }}
        margin={{ bottom: "small" }}
      >
        <Box
          direction={{ small: "column", medium: "row" }}
          justify="between"
          align={{ small: "start", medium: "center" }}
          pad="medium"
          gap="small"
          background="light-1"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer' }}
        >
            <PlayerName name={player.name} bbrefid={player.bbrefid} bold />
            <Box direction="row" gap={{ small: "small", medium: "large" }} align="center" wrap>
              {isPitcher ? (
                <>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">IP: {stats.IP}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">ERA: {stats.ERA}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">W: {stats.W}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">L: {stats.L}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">SV: {stats.SV}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">WAR: {stats.WAR}</Text></Box>
                </>
              ) : (
                <>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">PA: {stats.PA}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">HR: {stats.HR}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">R: {stats.R}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">RBI: {stats.RBI}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">AVG: {stats.BA}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">OPS: {stats.OPS}</Text></Box>
                  <Box pad={{ horizontal: "small" }}><Text weight="bold">WAR: {stats.WAR}</Text></Box>
                </>
              )}
            </Box>
            {isExpanded ? <FormUp /> : <FormDown />}
        </Box>
        {isExpanded && (
          <Box pad="small" background="light-1" gap="small">
            {player.contractMinimums && player.contractMinimums.length > 0 && (
              <Box gap="xxsmall">
                <Text weight="bold">Contract Minimums</Text>
                <Text size="small" color="text-weak">
                  {player.contractMinimums.map((minimum, idx) => (
                    <React.Fragment key={minimum.season.id}>
                      {idx > 0 && ' • '}
                      {minimum.duration} {minimum.duration === 1 ? 'yr' : 'yrs'}: <CurrencyFormat
                        value={minimum.amount}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                      />
                    </React.Fragment>
                  ))}
                </Text>
              </Box>
            )}

            {player.bids && player.bids.length > 0 ? (
              <Box gap="xxsmall">
                <Text weight="bold">Current Bids ({player.bids.length})</Text>
                <Box gap="xxsmall">
                  {player.bids.map((bid, idx) => {
                    const firstYear = bid.firstSeason?.name ? parseInt(bid.firstSeason.name) : null;
                    const lastYear = bid.lastSeason?.name ? parseInt(bid.lastSeason.name) : null;
                    const duration = firstYear && lastYear && !isNaN(firstYear) && !isNaN(lastYear)
                      ? lastYear - firstYear + 1
                      : 1;
                    return (
                      <Box
                        key={bid.id}
                        direction="column"
                        gap="xxsmall"
                        pad={{ horizontal: "small", vertical: "xsmall" }}
                        background={idx % 2 === 0 ? "white" : "light-1"}
                        round="xsmall"
                      >
                        <Box direction="row" justify="between">
                          <Text weight="bold">{bid.team.name}</Text>
                          <Text weight="bold">
                            <CurrencyFormat
                              value={bid.annualAmount}
                              displayType={"text"}
                              thousandSeparator={true}
                              prefix={"$"}
                            />
                          </Text>
                        </Box>
                        <Box direction="row" justify="between">
                          <Text size="small" color="text-weak">
                            {duration} {duration === 1 ? 'season' : 'seasons'}
                          </Text>
                          <Text size="small" color="text-weak">
                            Through {bid.lastSeason?.name || 'Unknown'}
                          </Text>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Box gap="xxsmall">
                <Text weight="bold">Current Bids</Text>
                <Text size="small" color="text-weak">No current bids</Text>
              </Box>
            )}
          </Box>
        )}
      </Box>
      <PlaceBidComponent
        player={playerData.player}
        teamId={auth.teamId}
        onBidCreated={() => {
          window.dispatchEvent(new CustomEvent('bidPlaced'));
          navigate(-1);
        }}
      />
    </Box>
  );
}
