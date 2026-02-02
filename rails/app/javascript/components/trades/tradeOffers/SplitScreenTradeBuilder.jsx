import React, { useState, useMemo, useEffect } from "react";
import { useMutation } from "graphql-hooks";
import { Box, Text, Heading, Select, Layer, Button } from "grommet";
import { FormUp, FormDown } from "grommet-icons";
import SelectableContractList from "./SelectableContractList";
import TradeSummary from "./TradeSummary";
import CurrencyInput from "../../CurrencyInput";

const CREATE_TRADE_MUTATION = `
mutation CreateTrade($input: CreateTradeMutationInput!) {
  createTrade(input:$input) {
    trade {
      id
    }
  }
}`;

function SplitScreenTradeBuilder({ teams, currentTeamId, initialTeamId, initialContract, onTradeSubmitted }) {
  // State management - store FULL contract objects, not just IDs
  const [fromContracts, setFromContracts] = useState([]);
  const [toContracts, setToContracts] = useState([]);
  const [toTeam, setToTeam] = useState(null);
  const [fromCash, setFromCash] = useState(0);
  const [toCash, setToCash] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isYourTeamExpanded, setIsYourTeamExpanded] = useState(true);
  const [isPartnerTeamExpanded, setIsPartnerTeamExpanded] = useState(true);

  const [createTradeMutation] = useMutation(CREATE_TRADE_MUTATION);

  // Find current user's team
  const fromTeam = teams.find(t => t.id == currentTeamId);

  // Available teams for trade partner selection (exclude current team)
  const availableTeams = teams.filter(t => t.id != currentTeamId);

  // Pre-select team and contract if provided
  useEffect(() => {
    if (initialTeamId && availableTeams.length > 0) {
      const teamToSelect = availableTeams.find(t => t.id == initialTeamId);
      if (teamToSelect) {
        setToTeam(teamToSelect);
      }
    }
  }, [initialTeamId, availableTeams]);

  // Pre-select the initial contract when it's loaded
  useEffect(() => {
    if (initialContract && toTeam) {
      setToContracts([initialContract]);
    }
  }, [initialContract, toTeam]);

  // Toggle handlers - store full contract objects
  const handleFromToggle = (contract, checked) => {
    if (checked) {
      setFromContracts([...fromContracts, contract]);
    } else {
      setFromContracts(fromContracts.filter(c => c.id !== contract.id));
    }
  };

  const handleToToggle = (contract, checked) => {
    if (checked) {
      setToContracts([...toContracts, contract]);
    } else {
      setToContracts(toContracts.filter(c => c.id !== contract.id));
    }
  };

  // Validation logic
  const validation = useMemo(() => {
    const errors = [];

    // Must select a partner team
    if (!toTeam) {
      errors.push('Please select a trade partner');
    }

    // No self-trades (backend also validates this)
    if (toTeam && fromTeam && toTeam.id === fromTeam.id) {
      errors.push('Cannot trade with yourself');
    }

    // Must include at least one asset (contract or cash) from either side
    const hasAnyAssets = fromContracts.length > 0 || toContracts.length > 0 || fromCash > 0 || toCash > 0;

    if (!hasAnyAssets) {
      errors.push('Trade must include at least one player or cash');
    }

    // Check eligibility - filter out ineligible contracts
    const ineligibleFrom = fromContracts.filter(c => !c.player.isTradeEligible);
    const ineligibleTo = toContracts.filter(c => !c.player.isTradeEligible);

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
  }, [fromContracts, toContracts, fromCash, toCash, toTeam, fromTeam]);

  // Submit handler
  const handleSubmit = async () => {
    if (!validation.isValid) return;

    try {
      setIsSubmitting(true);
      const payload = {
        toTeamId: toTeam.id,
        fromTeamId: fromTeam.id,
        toContractIds: toContracts.map(c => c.id),    // extract IDs for backend
        fromContractIds: fromContracts.map(c => c.id), // extract IDs for backend
        toCash: toCash,
        fromCash: fromCash,
      };

      const result = await createTradeMutation({ variables: { input: payload } });

      // Check for GraphQL errors
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

  // Reset selections when team changes
  const handleTeamChange = (option) => {
    setToTeam(option);
    setToContracts([]);
    setToCash(0);
  };

  return (
    <>
      <Box gap="small">
        {/* Summary Panel - Top */}
        <TradeSummary
          fromTeam={fromTeam}
          fromContracts={fromContracts}
          fromCash={fromCash}
          toTeam={toTeam}
          toContracts={toContracts}
          toCash={toCash}
          validation={validation}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        {/* Side by Side Layout */}
        <Box direction="row" gap="small">
          {/* Your Team - Left */}
          <Box flex>
            <Box
              round="small"
              overflow="hidden"
              border={{ color: "border", size: "xsmall" }}
            >
              <Box pad="small" background="light-1" gap="xsmall">
                <Text weight="bold">{fromTeam?.name || 'Your Team'}</Text>
                <Box
                  background="white"
                  round="xsmall"
                  border={{ color: "border", size: "xsmall" }}
                  pad="small"
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
              </Box>
              <Box pad="xsmall" background="light-1">
                <SelectableContractList
                  team={fromTeam}
                  selectedContracts={fromContracts}
                  onToggle={handleFromToggle}
                />
              </Box>
            </Box>
          </Box>

          {/* Trade Partner - Right */}
          <Box flex>
            <Box
              round="small"
              overflow="hidden"
              border={{ color: "border", size: "xsmall" }}
            >
              <Box pad="small" background="light-1" gap="xsmall">
                <Select
                  options={availableTeams}
                  labelKey={(option) => option.name}
                  valueKey={{ key: 'id', reduce: true }}
                  value={toTeam?.id}
                  onChange={({ option }) => handleTeamChange(option)}
                  placeholder='Select trade partner...'
                />
                {toTeam && (
                  <Box
                    background="white"
                    round="xsmall"
                    border={{ color: "border", size: "xsmall" }}
                    pad="small"
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
                )}
              </Box>
              {toTeam ? (
                <Box pad="xsmall" background="light-1">
                  <SelectableContractList
                    team={toTeam}
                    selectedContracts={toContracts}
                    onToggle={handleToToggle}
                  />
                </Box>
              ) : (
                <Box pad="medium" align="center" background="light-1">
                  <Text color='text-weak' size='small'>Select a trade partner</Text>
                </Box>
              )}
            </Box>
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
    </>
  );
}

export default SplitScreenTradeBuilder;
