import React, { useState, useMemo } from "react";
import { useMutation } from "graphql-hooks";
import { Grid, Box, Text, Heading, Select } from "grommet";
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

function SplitScreenTradeBuilder({ teams, currentTeamId, onTradeSubmitted }) {
  // State management - store FULL contract objects, not just IDs
  const [fromContracts, setFromContracts] = useState([]);
  const [toContracts, setToContracts] = useState([]);
  const [toTeam, setToTeam] = useState(null);
  const [fromCash, setFromCash] = useState(0);
  const [toCash, setToCash] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createTradeMutation] = useMutation(CREATE_TRADE_MUTATION);

  // Find current user's team
  const fromTeam = teams.find(t => t.id == currentTeamId);

  // Available teams for trade partner selection (exclude current team)
  const availableTeams = teams.filter(t => t.id != currentTeamId);

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

    // Must include at least one asset (contract or cash)
    const hasFromAssets = fromContracts.length > 0 || fromCash > 0;
    const hasToAssets = toContracts.length > 0 || toCash > 0;

    if (!hasFromAssets || !hasToAssets) {
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
      alert(`Error submitting trade: ${error.message}`);
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
    <Grid
      rows={['auto', 'auto']}
      columns={['1/2', '1/2']}
      gap='medium'
      pad='medium'
      areas={[
        { name: 'summaryPanel', start: [0, 0], end: [1, 0] },
        { name: 'leftPanel', start: [0, 1], end: [0, 1] },
        { name: 'rightPanel', start: [1, 1], end: [1, 1] },
      ]}
    >
      {/* Summary Panel - Top */}
      <Box gridArea='summaryPanel'>
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
      </Box>

      {/* Left Panel - Your Team */}
      <Box gridArea='leftPanel' gap='small'>
        {/* Team Header */}
        <Box pad='small' background='light-2' round='small' height='xsmall' justify='center'>
          <Text weight='bold' margin={{ bottom: 'xsmall' }}>Your Team:</Text>
          <Text>{fromTeam?.name || 'Your Team'} - Budget: ${fromTeam?.budget?.toLocaleString() || '0'}</Text>
        </Box>

        {/* Cash Input */}
        <Box pad='small' background='light-2' round='small' height='xsmall' justify='center'>
          <Text weight='bold' margin={{ bottom: 'xsmall' }}>Cash to send:</Text>
          <CurrencyInput
            value={fromCash}
            onChange={(event) => {
              setFromCash(parseInt(event.target.value) || 0);
            }}
            placeholder='Enter amount'
          />
        </Box>

        {/* Player Roster */}
        <Box>
          <SelectableContractList
            team={fromTeam}
            selectedContracts={fromContracts}
            onToggle={handleFromToggle}
          />
        </Box>
      </Box>

      {/* Right Panel - Partner Team */}
      <Box gridArea='rightPanel' gap='small'>
        {/* Team Selector with Team Info */}
        <Box pad='small' background='light-2' round='small' height='xsmall' justify='center'>
          <Text weight='bold' margin={{ bottom: 'xsmall' }}>Trade Partner:</Text>
          <Select
            options={availableTeams}
            labelKey={(option) => `${option.name} - Budget: $${option.budget?.toLocaleString() || '0'}`}
            valueKey={{ key: 'id', reduce: true }}
            value={toTeam?.id}
            onChange={({ option }) => handleTeamChange(option)}
            placeholder='Select team...'
          />
        </Box>

        {toTeam ? (
          <>

            {/* Cash Input */}
            <Box pad='small' background='light-2' round='small' height='xsmall' justify='center'>
              <Text weight='bold' margin={{ bottom: 'xsmall' }}>Cash to receive:</Text>
              <CurrencyInput
                value={toCash}
                onChange={(event) => {
                  setToCash(parseInt(event.target.value) || 0);
                }}
                placeholder='Enter amount'
              />
            </Box>

            {/* Player Roster */}
            <Box>
              <SelectableContractList
                team={toTeam}
                selectedContracts={toContracts}
                onToggle={handleToToggle}
              />
            </Box>
          </>
        ) : (
          /* Placeholder when no team selected */
          <Box align='center' justify='center' pad='large'>
            <Text color='text-weak'>Select a trade partner to continue</Text>
          </Box>
        )}
      </Box>
    </Grid>
  );
}

export default SplitScreenTradeBuilder;
