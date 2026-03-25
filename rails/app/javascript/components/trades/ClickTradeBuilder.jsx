import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "graphql-hooks";
import { Box, Text, Heading, Select, Layer, Button, Spinner, TextInput, Collapsible } from "grommet";
import { Close, Add, Search, FormDown, FormUp } from "grommet-icons";
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
          positions
          isTradeEligible
          tradeIneligibilityReason
        }
      }
    }
  }
`;

// Clickable Player Card Component
function PlayerCard({ contract, onAdd, onRemove, showAddButton, showRemoveButton, isDisabled, inTrade }) {
  const isEligible = contract.player.isTradeEligible;

  return (
    <Box
      background="white"
      round="xsmall"
      pad="xsmall"
      border={{ color: "border", size: "xsmall" }}
      margin={{ bottom: "xxsmall" }}
      style={{ opacity: (isEligible && !isDisabled && !inTrade) ? 1 : 0.5 }}
    >
      <Box direction="row" justify="between" align="center" gap="small">
        <Box direction="row" gap="small" align="center" flex>
          <PlayerName name={contract.player.name} bbrefid={contract.player.bbrefid} />
          <Text size="xsmall" color="text-weak">
            {contract.player.positions?.join(', ')} • <CurrencyFormat
              value={contract.amount}
              displayType={"text"}
              thousandSeparator={true}
              prefix={"$"}
            /> • {contract.lastSeason.name}
          </Text>
          {contract.summer && <Text size="xsmall" color="status-ok">SUMMER</Text>}
          {contract.franchise && <Text size="xsmall" color="brand">FRAN</Text>}
          {!isEligible && contract.player.tradeIneligibilityReason && (
            <Text size="xsmall" color="status-critical" weight="bold">
              {contract.player.tradeIneligibilityReason}
            </Text>
          )}
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
  const [fromRosterSearch, setFromRosterSearch] = useState("");
  const [toRosterSearch, setToRosterSearch] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(false);

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
  const allFromRosterContracts = fromTeamData?.team?.currentContracts || [];
  const allToRosterContracts = toTeamData?.team?.currentContracts || [];

  // Filter and sort rosters: selected players first, then alphabetical
  const fromRosterContracts = allFromRosterContracts
    .filter(contract =>
      contract.player.name.toLowerCase().includes(fromRosterSearch.toLowerCase())
    )
    .sort((a, b) => {
      const aInTrade = fromTradeZone.some(c => c.id === a.id);
      const bInTrade = fromTradeZone.some(c => c.id === b.id);
      if (aInTrade && !bInTrade) return -1;
      if (!aInTrade && bInTrade) return 1;
      return a.player.name.localeCompare(b.player.name);
    });

  const toRosterContracts = allToRosterContracts
    .filter(contract =>
      contract.player.name.toLowerCase().includes(toRosterSearch.toLowerCase())
    )
    .sort((a, b) => {
      const aInTrade = toTradeZone.some(c => c.id === a.id);
      const bInTrade = toTradeZone.some(c => c.id === b.id);
      if (aInTrade && !bInTrade) return -1;
      if (!aInTrade && bInTrade) return 1;
      return a.player.name.localeCompare(b.player.name);
    });

  return (
    <Box gap="medium">
      {/* Trade Summary / Actions at top */}
      <Box
        round="small"
        border={{ color: "border", size: "xsmall" }}
        pad="medium"
        background="light-1"
      >
        <Box direction="column" gap="small">
          <Box direction="row" justify="between" align="center">
            <Box direction="column" gap="xsmall">
              <Text weight="bold" size="large">Trade Summary</Text>
              {toTeam && (
                <Box direction="row" gap="medium">
                  <Box>
                    <Text size="small" color="text-weak">Sending: </Text>
                    <Text size="small" weight="bold">
                      {fromTradeZone.length === 0 && fromCash === 0 ? (
                        '—'
                      ) : (
                        <>
                          {fromTradeZone.length > 0 && `${fromTradeZone.length} player${fromTradeZone.length !== 1 ? 's' : ''}`}
                          {fromCash > 0 && (fromTradeZone.length > 0 ? ` + $${fromCash.toLocaleString()}` : `$${fromCash.toLocaleString()}`)}
                        </>
                      )}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="small" color="text-weak">Receiving: </Text>
                    <Text size="small" weight="bold">
                      {toTradeZone.length === 0 && toCash === 0 ? (
                        '—'
                      ) : (
                        <>
                          {toTradeZone.length > 0 && `${toTradeZone.length} player${toTradeZone.length !== 1 ? 's' : ''}`}
                          {toCash > 0 && (toTradeZone.length > 0 ? ` + $${toCash.toLocaleString()}` : `$${toCash.toLocaleString()}`)}
                        </>
                      )}
                    </Text>
                  </Box>
                </Box>
              )}
            </Box>
            <Button
              icon={summaryExpanded ? <FormUp /> : <FormDown />}
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              plain
            />
          </Box>
          <Collapsible open={summaryExpanded}>
          {!toTeam ? (
            <Box pad="medium" align="center">
              <Text size="small" color="text-weak">
                Select a trade partner to begin
              </Text>
            </Box>
          ) : (
            <Box direction="row" gap="large">
              {/* Sending column */}
              <Box flex basis="1/2">
                <Text size="small" margin={{ bottom: 'small' }} weight="bold">You send:</Text>
                {fromTradeZone.length === 0 && fromCash === 0 ? (
                  <Text size="small" color="text-weak">—</Text>
                ) : (
                  <Box
                    round="xsmall"
                    border={{ color: "border", size: "xsmall" }}
                    background="white"
                  >
                    {fromTradeZone.map((contract, index) => (
                      <Box
                        key={contract.id}
                        direction="row"
                        align="center"
                        justify="between"
                        pad={{ horizontal: "small", vertical: "xsmall" }}
                        border={index > 0 ? { side: "top", color: "border", size: "xsmall" } : undefined}
                      >
                        <Box direction="column" gap="xxsmall" flex>
                          <Box direction="row" align="center" gap="xsmall">
                            <PlayerName name={contract.player.name} bbrefid={contract.player.bbrefid} />
                            {contract.summer && <Text size="xsmall" color="status-ok">SUMMER</Text>}
                            {contract.franchise && <Text size="xsmall" color="brand">FRANCHISE</Text>}
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
                        <Button
                          icon={<Close size="small" />}
                          onClick={() => handleRemoveFromTeam(contract)}
                          size="small"
                          plain
                          tip="Remove"
                        />
                      </Box>
                    ))}
                    {fromCash > 0 && (
                      <Box
                        direction="row"
                        align="center"
                        justify="between"
                        pad={{ horizontal: "small", vertical: "xsmall" }}
                        border={(fromTradeZone.length > 0) ? { side: "top", color: "border", size: "xsmall" } : undefined}
                      >
                        <Text size="small">
                          <CurrencyFormat
                            value={fromCash}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                          /> cash
                        </Text>
                        <Button
                          icon={<Close size="small" />}
                          onClick={() => setFromCash(0)}
                          size="small"
                          plain
                          tip="Remove"
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {/* Receiving column */}
              <Box flex basis="1/2">
                <Text size="small" margin={{ bottom: 'small' }} weight="bold">You receive:</Text>
                {toTradeZone.length === 0 && toCash === 0 ? (
                  <Text size="small" color="text-weak">—</Text>
                ) : (
                  <Box
                    round="xsmall"
                    border={{ color: "border", size: "xsmall" }}
                    background="white"
                  >
                    {toTradeZone.map((contract, index) => (
                      <Box
                        key={contract.id}
                        direction="row"
                        align="center"
                        justify="between"
                        pad={{ horizontal: "small", vertical: "xsmall" }}
                        border={index > 0 ? { side: "top", color: "border", size: "xsmall" } : undefined}
                      >
                        <Box direction="column" gap="xxsmall" flex>
                          <Box direction="row" align="center" gap="xsmall">
                            <PlayerName name={contract.player.name} bbrefid={contract.player.bbrefid} />
                            {contract.summer && <Text size="xsmall" color="status-ok">SUMMER</Text>}
                            {contract.franchise && <Text size="xsmall" color="brand">FRANCHISE</Text>}
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
                        <Button
                          icon={<Close size="small" />}
                          onClick={() => handleRemoveToTeam(contract)}
                          size="small"
                          plain
                          tip="Remove"
                        />
                      </Box>
                    ))}
                    {toCash > 0 && (
                      <Box
                        direction="row"
                        align="center"
                        justify="between"
                        pad={{ horizontal: "small", vertical: "xsmall" }}
                        border={(toTradeZone.length > 0) ? { side: "top", color: "border", size: "xsmall" } : undefined}
                      >
                        <Text size="small">
                          <CurrencyFormat
                            value={toCash}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                          /> cash
                        </Text>
                        <Button
                          icon={<Close size="small" />}
                          onClick={() => setToCash(0)}
                          size="small"
                          plain
                          tip="Remove"
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Action button at bottom left */}
          <Box direction="row" justify="between" align="center" margin={{ top: "small" }}>
            <Box direction="row" gap="small" align="center">
              <Button
                primary
                label={isSubmitting ? "Submitting..." : "Propose Trade"}
                onClick={handleSubmit}
                disabled={!validation.isValid || isSubmitting}
              />
              {validation.errors.length > 0 && (
                <Text size="small" color="status-critical">
                  {validation.errors[0]}
                </Text>
              )}
            </Box>
          </Box>
          </Collapsible>
        </Box>
      </Box>

      {/* Two column layout */}
      <Box direction={{ small: "column", medium: "row" }} gap="small">
        {/* Your Roster - Left */}
        <Box flex>
          <Box
            round="small"
            border={{ color: "border", size: "xsmall" }}
            background="light-1"
            pad="small"
            style={{ minHeight: "400px" }}
          >
            <Box
              margin={{ bottom: "small" }}
              height={{ min: "48px" }}
              justify="center"
              style={{ paddingLeft: "12px" }}
            >
              <Text weight="bold" size="large">
                {fromTeam?.name || "Your Team"}
              </Text>
            </Box>
            <Box
              background="white"
              round="xsmall"
              border={{ color: "border", size: "xsmall" }}
              pad="small"
              margin={{ bottom: "small" }}
            >
              <Text size="small" margin={{ bottom: 'xsmall' }}>Cash to send:</Text>
              <Box style={{ position: 'relative' }}>
                <CurrencyInput
                  value={fromCash}
                  onChange={(event) => {
                    setFromCash(parseInt(event.target.value) || 0);
                  }}
                  placeholder='Enter amount'
                  disabled={!toTeam}
                />
                {fromCash > 0 && (
                  <Button
                    icon={<Close />}
                    onClick={() => setFromCash(0)}
                    plain
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                )}
              </Box>
            </Box>
            {fromTeamLoading ? (
              <Spinner size="small" />
            ) : (
              <>
                {fromTradeZone.length > 0 && fromRosterContracts.some(c => fromTradeZone.find(t => t.id === c.id)) && (
                  <>
                    <Box
                      background="status-ok"
                      pad={{ horizontal: "small", vertical: "xxsmall" }}
                      margin={{ bottom: "xsmall" }}
                      round="xxsmall"
                    >
                      <Text size="xsmall" weight="bold" color="white">IN TRADE</Text>
                    </Box>
                    {fromRosterContracts.filter(c => fromTradeZone.find(t => t.id === c.id)).map(contract => (
                      <PlayerCard
                        key={contract.id}
                        contract={contract}
                        onAdd={handleAddFromTeam}
                        onRemove={handleRemoveFromTeam}
                        showAddButton={false}
                        showRemoveButton={true}
                        isDisabled={!toTeam}
                        inTrade={true}
                      />
                    ))}
                    <Box
                      border={{ side: "bottom", color: "border", size: "small" }}
                      margin={{ vertical: "small" }}
                    />
                  </>
                )}
                <Box margin={{ bottom: "small" }}>
                  <TextInput
                    placeholder="Search players..."
                    value={fromRosterSearch}
                    onChange={(event) => setFromRosterSearch(event.target.value)}
                    icon={<Search />}
                  />
                </Box>
                {fromRosterContracts.filter(c => !fromTradeZone.find(t => t.id === c.id)).length > 0 && (
                  <Box overflow="auto" flex>
                    {fromTradeZone.length > 0 && (
                      <Box
                        background="light-3"
                        pad={{ horizontal: "small", vertical: "xxsmall" }}
                        margin={{ bottom: "xsmall" }}
                        round="xxsmall"
                      >
                        <Text size="xsmall" weight="bold" color="text-weak">AVAILABLE</Text>
                      </Box>
                    )}
                    {fromRosterContracts.filter(c => !fromTradeZone.find(t => t.id === c.id)).map(contract => (
                      <PlayerCard
                        key={contract.id}
                        contract={contract}
                        onAdd={handleAddFromTeam}
                        onRemove={handleRemoveFromTeam}
                        showAddButton={true}
                        showRemoveButton={false}
                        isDisabled={!toTeam}
                        inTrade={false}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Their Roster - Right */}
        <Box flex>
          <Box
            round="small"
            border={{ color: "border", size: "xsmall" }}
            background="light-1"
            pad="small"
            style={{ minHeight: "400px" }}
          >
            <Box margin={{ bottom: "small" }}>
              <Select
                options={availableTeams}
                labelKey={(option) => option.name}
                valueKey={{ key: 'id', reduce: true }}
                value={toTeam?.id}
                onChange={({ option }) => handleTeamChange(option)}
                placeholder='Select trade partner...'
                size="large"
              />
            </Box>
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
                  <Box style={{ position: 'relative' }}>
                    <CurrencyInput
                      value={toCash}
                      onChange={(event) => {
                        setToCash(parseInt(event.target.value) || 0);
                      }}
                      placeholder='Enter amount'
                    />
                    {toCash > 0 && (
                      <Button
                        icon={<Close />}
                        onClick={() => setToCash(0)}
                        plain
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    )}
                  </Box>
                </Box>
                {toTeamLoading ? (
                  <Spinner size="small" />
                ) : (
                  <>
                    {toTradeZone.length > 0 && toRosterContracts.some(c => toTradeZone.find(t => t.id === c.id)) && (
                      <>
                        <Box
                          background="status-ok"
                          pad={{ horizontal: "small", vertical: "xxsmall" }}
                          margin={{ bottom: "xsmall" }}
                          round="xxsmall"
                        >
                          <Text size="xsmall" weight="bold" color="white">IN TRADE</Text>
                        </Box>
                        {toRosterContracts.filter(c => toTradeZone.find(t => t.id === c.id)).map(contract => (
                          <PlayerCard
                            key={contract.id}
                            contract={contract}
                            onAdd={handleAddToTeam}
                            onRemove={handleRemoveToTeam}
                            showAddButton={false}
                            showRemoveButton={true}
                            isDisabled={false}
                            inTrade={true}
                          />
                        ))}
                        <Box
                          border={{ side: "bottom", color: "border", size: "small" }}
                          margin={{ vertical: "small" }}
                        />
                      </>
                    )}
                    <Box margin={{ bottom: "small" }}>
                      <TextInput
                        placeholder="Search players..."
                        value={toRosterSearch}
                        onChange={(event) => setToRosterSearch(event.target.value)}
                        icon={<Search />}
                      />
                    </Box>
                    {toRosterContracts.filter(c => !toTradeZone.find(t => t.id === c.id)).length > 0 && (
                      <Box overflow="auto" flex>
                        {toTradeZone.length > 0 && (
                          <Box
                            background="light-3"
                            pad={{ horizontal: "small", vertical: "xxsmall" }}
                            margin={{ bottom: "xsmall" }}
                            round="xxsmall"
                          >
                            <Text size="xsmall" weight="bold" color="text-weak">AVAILABLE</Text>
                          </Box>
                        )}
                        {toRosterContracts.filter(c => !toTradeZone.find(t => t.id === c.id)).map(contract => (
                          <PlayerCard
                            key={contract.id}
                            contract={contract}
                            onAdd={handleAddToTeam}
                            onRemove={handleRemoveToTeam}
                            showAddButton={true}
                            showRemoveButton={false}
                            isDisabled={false}
                            inTrade={false}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                )}
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
