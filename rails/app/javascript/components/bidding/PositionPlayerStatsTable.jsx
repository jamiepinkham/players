import React, { useState } from "react";
import { Button, DataTable, Box, Text, Grid, Spinner } from "grommet";
import { Currency } from "grommet-icons";
import CurrencyFormat from "react-currency-format";
import LeadingBidComponent from "./LeadingBidComponent";
import PlayerName from "../players/PlayerName";
import { DATA_TABLE_THEME } from "../../constants/ui";

export default function PositionPlayerStatsTable({
  players,
  position,
  onPlayerSelected,
  includeBidLink,
  includeLeadingBid,
  showContractMinimums = false,
  showAllBids = false,
  defaultExpanded = false,
  showContractAccordion = false,
  teamId
}) {
  const formatPlayerStats = (player) => {
    const stats = {};
    player.stats.forEach(stat => {
      stats[stat.title] = stat.value;
    });
    return stats;
  };

  const renderPlayerLabel = (player) => {
    const stats = formatPlayerStats(player);
    const hasNoBbrefid = !player.bbrefid;
    const StatValue = ({ label, value }) => (
      <Box pad={{ horizontal: "small" }}>
        <Text weight="bold">
          {label}: {hasNoBbrefid ? "--" : (value || <Spinner size="xsmall" />)}
        </Text>
      </Box>
    );

    const statsContent = position === "SP" || position === "RP" ? (
      <>
        <StatValue label="IP" value={stats.IP} />
        <StatValue label="ERA" value={stats.ERA} />
        <StatValue label="W" value={stats.W} />
        <StatValue label="L" value={stats.L} />
        <StatValue label="SV" value={stats.SV} />
      </>
    ) : (
      <>
        <StatValue label="PA" value={stats.PA} />
        <StatValue label="HR" value={stats.HR} />
        <StatValue label="R" value={stats.R} />
        <StatValue label="RBI" value={stats.RBI} />
        <StatValue label="AVG" value={stats.BA} />
        <StatValue label="OPS" value={stats.OPS} />
      </>
    );

    const contractSummary = (showContractAccordion && player.contractMinimums) ? (
      <Text size="xsmall" color="text-weak">
        {player.contractMinimums.length > 0
          ? `Min: ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(player.contractMinimums[0].amount)}`
          : "No contract options"}
        {` • ${player.bids ? player.bids.length : 0} ${(player.bids && player.bids.length === 1) ? 'bid' : 'bids'}`}
      </Text>
    ) : null;

    return (
      <Box direction="row" justify="between" align="center" pad="small" width="100%" gap="small">
        <Box width="medium" gap="xxsmall">
          <PlayerName name={player.name} bbrefid={player.bbrefid} bold />
          {contractSummary}
        </Box>
        <Box flex direction="row" gap="large" align="center" justify="end">
          {statsContent}
        </Box>
      </Box>
    );
  };

  const [activeIndexes, setActiveIndexes] = useState(
    defaultExpanded && players.length === 1 ? [0] : []
  );

  return (
    <Box round="small" overflow="hidden" border={{ color: "border", size: "xsmall" }}>
      {players.map((player, idx) => {
          const bid = player.bids ? player.bids[0] : null;

          // Check if the current team has already bid on this player
          const hasExistingBid = player.hasMyTeamBid || (teamId && player.bids?.some(bid => {
            return String(bid.team.id) === String(teamId);
          }));

          return (
            <Box key={player.id} border={{ side: idx > 0 ? "top" : undefined, color: "border", size: "xsmall" }}>
              <Box direction="row" align="center">
                <Box
                  flex
                  onClick={() => {
                    const newIndexes = activeIndexes.includes(idx)
                      ? activeIndexes.filter(i => i !== idx)
                      : [...activeIndexes, idx];
                    setActiveIndexes(newIndexes);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {renderPlayerLabel(player)}
                </Box>
                {includeBidLink && (
                  <Box pad={{ right: "small" }}>
                    <Button
                      primary={!hasExistingBid}
                      size="small"
                      label={hasExistingBid ? "Bid Placed" : "Place Bid"}
                      icon={<Currency color={hasExistingBid ? "status-ok" : "white"} />}
                      disabled={hasExistingBid}
                      onClick={() => onPlayerSelected(player)}
                      tip={hasExistingBid ? "You already have a bid on this player" : undefined}
                    />
                  </Box>
                )}
              </Box>
              {activeIndexes.includes(idx) && (
              <Box pad="small" background="light-1" gap="small">
                {showContractAccordion && player.contractMinimums ? (
                  <>
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
                  </>
                ) : !showContractAccordion && showContractMinimums && player.contractMinimums && (
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

                {!showContractAccordion && showAllBids && player.bids && player.bids.length > 0 ? (
                  <Box gap="small">
                    <Text weight="bold">Current Bids ({player.bids.length})</Text>
                    <Box gap="xsmall">
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
                            pad="small"
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
                ) : !showContractAccordion && showAllBids ? (
                  <Box gap="small">
                    <Text weight="bold">Current Bids</Text>
                    <Text color="text-weak">No current bids</Text>
                  </Box>
                ) : !showContractAccordion && bid ? (
                  <Box gap="small">
                    <Text weight="bold">Leading Bid</Text>
                    <Box gap="xxsmall">
                      <Text>
                        <CurrencyFormat
                          value={bid.annualAmount}
                          displayType={"text"}
                          thousandSeparator={true}
                          prefix={"$"}
                        /> per year
                      </Text>
                      <Text>Through: {bid.lastSeason.name}</Text>
                      <Text>Team: {bid.team.name ?? ""}</Text>
                    </Box>
                  </Box>
                ) : !showContractAccordion ? (
                  <Text color="text-weak">No current bids</Text>
                ) : null}
              </Box>
              )}
            </Box>
          );
        })}
    </Box>
  );
}
