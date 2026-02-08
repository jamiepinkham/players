import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "graphql-hooks";
import { Box, Text, Heading, Select, Layer, Button, Spinner } from "grommet";
import { Close, Add } from "grommet-icons";
import CurrencyFormat from "react-currency-format";
import CurrencyInput from "../common/CurrencyInput";
import PlayerName from "../players/PlayerName";

const CREATE_TRADE_MUTATION = `
mutation CreateTrade($input: CreateTradeMutationInput!) {
  createTrade(input:$input) {
    trade {
      id
    }
  }
}`;

const TEAM_CONTRACTS_QUERY = `
query TradingConsoleTeamContractsQuery($teamId: ID!)  {
    team(id: $teamId) {
      id
      name
      budget
      currentContracts {
        id
        firstSeason {
          name
        }
        lastSeason {
          name
        }
        amount
        summer
        franchise
        player {
          name
          bbrefid
          position
          isTradeEligible
          tradeIneligibilityReason
          stats {
            title
            value
          }
        }
      }
    }
  }
`;

// Clickable Player Card Component
function PlayerCard({ contract, onAdd, onRemove, showAddButton, showRemoveButton, isDisabled }) {
  const isEligible = contract.player.isTradeEligible;

  return (
    <Box
      background="white"
      round="xsmall"
      pad="small"
      border={{ color: "border", size: "xsmall" }}
      margin={{ bottom: "xxsmall" }}
      style={{ opacity: (isEligible && !isDisabled) ? 1 : 0.4 }}
    >
      <Box direction="row" justify="between" align="center" gap="small">
        <Box direction="column" gap="xxsmall" flex>
          <Box direction="row" justify="between" align="center">
            <Box direction="row" gap="xsmall" align="center">
              <PlayerName name={contract.player.name} bbrefid={contract.player.bbrefid} />
              {contract.summer && (
                <Box
                  background="status-ok"
                  round="xsmall"
                  pad={{ horizontal: "xsmall", vertical: "xxsmall" }}
                >
                  <Text size="xxsmall" color="white" weight="bold">SUMMER</Text>
                </Box>
              )}
              {contract.franchise && (
                <Box
                  background="brand"
                  round="xsmall"
                  pad={{ horizontal: "xsmall", vertical: "xxsmall" }}
                >
                  <Text size="xxsmall" color="white" weight="bold">FRANCHISE</Text>
                </Box>
              )}
            </Box>
            {!isEligible && contract.player.tradeIneligibilityReason && (
              <Text size="xsmall" color="status-error" weight="bold">
                {contract.player.tradeIneligibilityReason}
              </Text>
            )}
          </Box>
          <Text size="xsmall" color="text-weak">
            {contract.player.position} • <CurrencyFormat
              value={contract.amount}
              displayType={"text"}
              thousandSeparator={true}
              prefix={"$"}
            /> • {contract.lastSeason.name}
          </Text>
        </Box>
        {showAddButton && isEligible && (
          <Button
            icon={<Add size="small" />}
            onClick={() => onAdd(contract)}
            size="small"
            tip="Add to trade"
            disabled={isDisabled}
          />
        )}
        {showRemoveButton && (
          <Button
            icon={<Close size="small" />}
            onClick={() => onRemove(contract)}
            size="small"
            tip="Remove from trade"
          />
        )}
      </Box>
    </Box>
  );
}

function ClickTradeBuilder({ teams, currentTeamId, initialTeamId, initialContract, onTradeSubmitted }) {
  // State management
  const [toTeam, setToTeam] = useState(null);
  const [fromCash, setFromCash] = useState(0);
  const [toCash, setToCash] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Track which contracts are in the trade zone
  const [fromTradeZone, setFromTradeZone] = useState([]); // contracts from your team
  const [toTradeZone, setToTradeZone] = useState([]); // contracts from their team

  const [createTradeMutation] = useMutation(CREATE_TRADE_MUTATION);

  // Find current user's team
  const fromTeam = teams.find(t => t.id == currentTeamId);
  const availableTeams = teams.filter(t => t.id != currentTeamId);

  // Query for your team's contracts
  const { data: fromTeamData, loading: fromTeamLoading } = useQuery(TEAM_CONTRACTS_QUERY, {
    variables: { teamId: currentTeamId }
  });

  // Query for trade partner's contracts
  const { data: toTeamData, loading: toTeamLoading } = useQuery(TEAM_CONTRACTS_QUERY, {
    variables: { teamId: toTeam?.id },
    skip: !toTeam
  });

  // Pre-select team and contract if provided
  useEffect(() => {
    if (initialTeamId && availableTeams.length > 0) {
      const teamToSelect = availableTeams.find(t => t.id == initialTeamId);
      if (teamToSelect) {
        setToTeam(teamToSelect);
      }
    }
  }, [initialTeamId, availableTeams]);

  useEffect(() => {
    if (initialContract && toTeam) {
      setToTradeZone([initialContract]);
    }
  }, [initialContract, toTeam]);

  // Add to trade zone
  const handleAddFromTeam = (contract) => {
    if (!fromTradeZone.find(c => c.id === contract.id)) {
      setFromTradeZone([...fromTradeZone, contract]);
    }
  };

  const handleAddToTeam = (contract) => {
    if (!toTradeZone.find(c => c.id === contract.id)) {
      setToTradeZone([...toTradeZone, contract]);
    }
  };

  // Remove from trade zone
  const handleRemoveFromTeam = (contract) => {
    setFromTradeZone(fromTradeZone.filter(c => c.id !== contract.id));
  };

  const handleRemoveToTeam = (contract) => {
    setToTradeZone(toTradeZone.filter(c => c.id !== contract.id));
  };

  // Validation logic
  const validation = useMemo(() => {
    const errors = [];

    if (!toTeam) {
      errors.push('Please select a trade partner');
    }

    if (toTeam && fromTeam && toTeam.id === fromTeam.id) {
      errors.push('Cannot trade with yourself');
    }

    const hasAnyAssets = fromTradeZone.length > 0 || toTradeZone.length > 0 || fromCash > 0 || toCash > 0;

    if (!hasAnyAssets) {
      errors.push('Trade must include at least one player or cash');
    }

    const ineligibleFrom = fromTradeZone.filter(c => !c.player.isTradeEligible);
    const ineligibleTo = toTradeZone.filter(c => !c.player.isTradeEligible);

    if (ineligibleFrom.length > 0) {
      errors.push(`Ineligible players: ${ineligibleFrom.map(c => c.player.name).join(', ')}`);
    }
    if (ineligibleTo.length > 0) {
      errors.push(`Ineligible players: ${ineligibleTo.map(c => c.player.name).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [fromTradeZone, toTradeZone, fromCash, toCash, toTeam, fromTeam]);

  // Submit handler
  const handleSubmit = async () => {
    if (!validation.isValid) return;

    try {
      setIsSubmitting(true);
      const payload = {
        toTeamId: toTeam.id,
        fromTeamId: fromTeam.id,
        toContractIds: toTradeZone.map(c => c.id),
        fromContractIds: fromTradeZone.map(c => c.id),
        toCash: toCash,
        fromCash: fromCash,
      };

      const result = await createTradeMutation({ variables: { input: payload } });

      if (result.error) {
        throw new Error(result.error.graphQLErrors?.[0]?.message || result.error.message);
      }

      onTradeSubmitted();
    } catch (error) {
      console.error('Trade submission error:', error);
      setNotification({ message: `Error submitting trade: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset when team changes
  const handleTeamChange = (option) => {
    setToTeam(option);
    setToTradeZone([]);
    setToCash(0);
  };

  // Get all contracts from rosters
  const fromRosterContracts = fromTeamData?.team?.currentContracts || [];
  const toRosterContracts = toTeamData?.team?.currentContracts || [];

  return (
    <Box gap="small">
      {/* Trade Summary / Actions at top */}
      <Box
        round="small"
        border={{ color: "border", size: "xsmall" }}
        pad="medium"
        background="light-1"
      >
        <Box direction="column" gap="small">
          <Box direction="row" justify="between" align="center">
            <Text weight="bold" size="large">Trade Summary</Text>
            {toTeam && (
              <Text size="small" color="text-weak">
                {fromTeam?.name} ↔ {toTeam.name}
              </Text>
            )}
          </Box>
          {!toTeam ? (
            <Box pad="medium" align="center">
              <Text size="small" color="text-weak">
                Select a trade partner to begin
              </Text>
            </Box>
          ) : (
            <Box direction="row" gap="large">
              {/* Sending column */}
              <Box flex gap="xsmall">
                <Box pad="small">
                  <Text size="small" margin={{ bottom: 'xsmall' }} weight="bold">{fromTeam?.name} sends:</Text>
                  {fromTradeZone.length === 0 && fromCash === 0 ? (
                    <Text size="small" color="text-weak">—</Text>
                  ) : (
                    <Box gap="xxsmall">
                      {fromTradeZone.map(contract => (
                        <Text key={contract.id} size="small">
                          • {contract.player.name}
                          {contract.summer && <Text size="xsmall" color="status-ok"> SUMMER</Text>}
                          {contract.franchise && <Text size="xsmall" color="brand"> FRANCHISE</Text>}
                        </Text>
                      ))}
                      {fromCash > 0 && (
                        <Text size="small">
                          • <CurrencyFormat
                            value={fromCash}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                          /> cash
                        </Text>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Receiving column */}
              <Box flex gap="xsmall">
                <Box pad="small">
                  <Text size="small" margin={{ bottom: 'xsmall' }} weight="bold">{toTeam?.name} sends:</Text>
                  {toTradeZone.length === 0 && toCash === 0 ? (
                    <Text size="small" color="text-weak">—</Text>
                  ) : (
                    <Box gap="xxsmall">
                      {toTradeZone.map(contract => (
                        <Text key={contract.id} size="small">
                          • {contract.player.name}
                          {contract.summer && <Text size="xsmall" color="status-ok"> SUMMER</Text>}
                          {contract.franchise && <Text size="xsmall" color="brand"> FRANCHISE</Text>}
                        </Text>
                      ))}
                      {toCash > 0 && (
                        <Text size="small">
                          • <CurrencyFormat
                            value={toCash}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                          /> cash
                        </Text>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* Action button at bottom left */}
          <Box direction="row" justify="between" align="center">
            <Box direction="row" gap="small" align="center">
              <Button
                primary
                label={isSubmitting ? "Submitting..." : "Propose Trade"}
                onClick={handleSubmit}
                disabled={!validation.isValid || isSubmitting}
              />
              {validation.errors.length > 0 && (
                <Text size="xsmall" color="status-error">
                  {validation.errors[0]}
                </Text>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Three column layout */}
      <Box direction="row" gap="small">
        {/* Your Roster - Left */}
        <Box flex basis="1/3">
          <Box
            round="small"
            border={{ color: "border", size: "xsmall" }}
            background="light-1"
            pad="small"
            style={{ minHeight: "400px" }}
          >
            <Text weight="bold" margin={{ bottom: "small" }}>{fromTeam?.name || "Your Team"}</Text>
            <Box
              background="white"
              round="xsmall"
              border={{ color: "border", size: "xsmall" }}
              pad="small"
              margin={{ bottom: "small" }}
            >
              <Text size="small" margin={{ bottom: 'xsmall' }}>Cash to send:</Text>
              <CurrencyInput
                value={fromCash}
                onChange={(event) => {
                  setFromCash(parseInt(event.target.value) || 0);
                }}
                placeholder='Enter amount'
              />
            </Box>
            <Box overflow="auto" flex>
              {fromTeamLoading ? (
                <Spinner size="small" />
              ) : (
                fromRosterContracts.map(contract => (
                  <PlayerCard
                    key={contract.id}
                    contract={contract}
                    onAdd={handleAddFromTeam}
                    showAddButton={true}
                    isDisabled={fromTradeZone.find(c => c.id === contract.id)}
                  />
                ))
              )}
            </Box>
          </Box>
        </Box>

        {/* Trade Zone - Center */}
        <Box flex basis="1/3">
          <Box
            round="small"
            border={{ color: "brand", size: "small" }}
            background="light-2"
            pad="small"
            style={{ minHeight: "400px" }}
          >
            <Text weight="bold" margin={{ bottom: "small" }}>Trade Zone</Text>
            <Box gap="small" overflow="auto" flex>
              {fromTradeZone.length === 0 && toTradeZone.length === 0 && fromCash === 0 && toCash === 0 ? (
                <Box align="center" pad="large">
                  <Text color="text-weak" textAlign="center" size="small">
                    Click the + button on players to add them to the trade
                  </Text>
                </Box>
              ) : (
                <>
                  {(fromTradeZone.length > 0 || fromCash > 0) && (
                    <Box>
                      <Text size="small" weight="bold" color="text-weak" margin={{ bottom: "xxsmall" }}>
                        You're sending:
                      </Text>
                      {fromTradeZone.map(contract => (
                        <PlayerCard
                          key={contract.id}
                          contract={contract}
                          onRemove={handleRemoveFromTeam}
                          showRemoveButton={true}
                        />
                      ))}
                      {fromCash > 0 && (
                        <Box
                          background="white"
                          round="xsmall"
                          pad="small"
                          border={{ color: "border", size: "xsmall" }}
                          margin={{ bottom: "xxsmall" }}
                        >
                          <Text size="small" weight="bold">
                            <CurrencyFormat
                              value={fromCash}
                              displayType={"text"}
                              thousandSeparator={true}
                              prefix={"$"}
                            /> cash
                          </Text>
                        </Box>
                      )}
                    </Box>
                  )}
                  {(toTradeZone.length > 0 || toCash > 0) && (
                    <Box>
                      <Text size="small" weight="bold" color="text-weak" margin={{ bottom: "xxsmall" }}>
                        You're receiving:
                      </Text>
                      {toTradeZone.map(contract => (
                        <PlayerCard
                          key={contract.id}
                          contract={contract}
                          onRemove={handleRemoveToTeam}
                          showRemoveButton={true}
                        />
                      ))}
                      {toCash > 0 && (
                        <Box
                          background="white"
                          round="xsmall"
                          pad="small"
                          border={{ color: "border", size: "xsmall" }}
                          margin={{ bottom: "xxsmall" }}
                        >
                          <Text size="small" weight="bold">
                            <CurrencyFormat
                              value={toCash}
                              displayType={"text"}
                              thousandSeparator={true}
                              prefix={"$"}
                            /> cash
                          </Text>
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* Their Roster - Right */}
        <Box flex basis="1/3">
          <Box
            round="small"
            border={{ color: "border", size: "xsmall" }}
            background="light-1"
            pad="small"
            style={{ minHeight: "400px" }}
          >
            <Select
              options={availableTeams}
              labelKey={(option) => option.name}
              valueKey={{ key: 'id', reduce: true }}
              value={toTeam?.id}
              onChange={({ option }) => handleTeamChange(option)}
              placeholder='Select trade partner...'
              margin={{ bottom: "small" }}
            />
            {toTeam && (
              <>
                <Box
                  background="white"
                  round="xsmall"
                  border={{ color: "border", size: "xsmall" }}
                  pad="small"
                  margin={{ bottom: "small" }}
                >
                  <Text size="small" margin={{ bottom: 'xsmall' }}>Cash to receive:</Text>
                  <CurrencyInput
                    value={toCash}
                    onChange={(event) => {
                      setToCash(parseInt(event.target.value) || 0);
                    }}
                    placeholder='Enter amount'
                  />
                </Box>
                <Box overflow="auto" flex>
                  {toTeamLoading ? (
                    <Spinner size="small" />
                  ) : (
                    toRosterContracts.map(contract => (
                      <PlayerCard
                        key={contract.id}
                        contract={contract}
                        onAdd={handleAddToTeam}
                        showAddButton={true}
                        isDisabled={toTradeZone.find(c => c.id === contract.id)}
                      />
                    ))
                  )}
                </Box>
              </>
            )}
            {!toTeam && (
              <Box align="center" pad="large">
                <Text color="text-weak" size="small">Select a trade partner</Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {notification && (
        <Layer
          position="top"
          modal={false}
          margin={{ vertical: "medium", horizontal: "small" }}
          responsive={false}
          plain
        >
          <Box
            background={notification.type === 'error' ? 'status-error' : 'status-ok'}
            pad="medium"
            gap="small"
            round="small"
            elevation="medium"
          >
            <Text color="white">{notification.message}</Text>
            <Button
              label="Dismiss"
              onClick={() => setNotification(null)}
              size="small"
              secondary
            />
          </Box>
        </Layer>
      )}
    </Box>
  );
}

export default ClickTradeBuilder;
