import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "graphql-hooks";
import { Box, Text, Heading, Select, Layer, Button, Spinner } from "grommet";
import { DndContext, DragOverlay, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import CurrencyFormat from "react-currency-format";
import CurrencyInput from "../../CurrencyInput";
import PlayerName from "../../PlayerName";

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

// Draggable Player Card Component
function DraggablePlayerCard({ contract, isDragging, origin }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `${origin}-${contract.id}`,
    data: { contract, origin }
  });

  const isEligible = contract.player.isTradeEligible;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    cursor: isEligible ? 'grab' : 'not-allowed',
    opacity: isEligible ? (isDragging ? 0.5 : 1) : 0.4
  } : {
    cursor: isEligible ? 'grab' : 'not-allowed',
    opacity: isEligible ? (isDragging ? 0.5 : 1) : 0.4
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      background="white"
      round="xsmall"
      pad="small"
      border={{ color: "border", size: "xsmall" }}
      margin={{ bottom: "xxsmall" }}
    >
      <Box direction="column" gap="xxsmall">
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
    </Box>
  );
}

// Drop Zone Component
function DropZone({ id, children, isOver, label }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      background={isOver ? "light-2" : "light-1"}
      round="small"
      pad="small"
      border={{
        color: isOver ? "brand" : "border",
        size: isOver ? "medium" : "xsmall",
        style: isOver ? "dashed" : "solid"
      }}
      flex
      style={{ minHeight: "400px", transition: "all 0.2s" }}
    >
      {label && (
        <Text weight="bold" margin={{ bottom: "small" }}>
          {label}
        </Text>
      )}
      <Box gap="xxsmall" flex>
        {children}
      </Box>
    </Box>
  );
}

function DragDropTradeBuilder({ teams, currentTeamId, initialTeamId, initialContract, onTradeSubmitted }) {
  // State management
  const [toTeam, setToTeam] = useState(null);
  const [fromCash, setFromCash] = useState(0);
  const [toCash, setToCash] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeId, setActiveId] = useState(null);

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

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const contract = activeData.contract;
    const origin = activeData.origin;

    // Don't allow ineligible players to be traded
    if (!contract.player.isTradeEligible) return;

    // Determine action based on drop zone
    if (over.id === "trade-zone") {
      // Moving to trade zone
      if (origin === "from-roster") {
        if (!fromTradeZone.find(c => c.id === contract.id)) {
          setFromTradeZone([...fromTradeZone, contract]);
        }
      } else if (origin === "to-roster") {
        if (!toTradeZone.find(c => c.id === contract.id)) {
          setToTradeZone([...toTradeZone, contract]);
        }
      }
    } else if (over.id === "from-roster") {
      // Moving back to your roster
      if (origin === "from-roster" || active.id.startsWith("from-roster")) {
        setFromTradeZone(fromTradeZone.filter(c => c.id !== contract.id));
      }
    } else if (over.id === "to-roster") {
      // Moving back to their roster
      if (origin === "to-roster" || active.id.startsWith("to-roster")) {
        setToTradeZone(toTradeZone.filter(c => c.id !== contract.id));
      }
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
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

  // Get contracts that are still in roster (not in trade zone)
  const fromRosterContracts = fromTeamData?.team?.currentContracts?.filter(
    c => !fromTradeZone.find(tc => tc.id === c.id)
  ) || [];

  const toRosterContracts = toTeamData?.team?.currentContracts?.filter(
    c => !toTradeZone.find(tc => tc.id === c.id)
  ) || [];

  // Find the active contract being dragged for the overlay
  const activeContract = activeId ?
    [...(fromTeamData?.team?.currentContracts || []), ...(toTeamData?.team?.currentContracts || [])]
      .find(c => activeId.includes(c.id)) : null;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <Box gap="small">
        {/* Trade Summary / Actions at top */}
        <Box
          round="small"
          border={{ color: "border", size: "xsmall" }}
          pad="medium"
          background="light-1"
        >
          <Box direction="row" justify="between" align="center" gap="medium">
            <Box flex>
              <Text weight="bold" size="large">Trade Summary</Text>
              <Box direction="row" gap="medium" margin={{ top: "small" }}>
                <Box>
                  <Text size="small" color="text-weak">Sending:</Text>
                  <Text size="small">
                    {fromTradeZone.length} player{fromTradeZone.length !== 1 ? 's' : ''}
                    {fromCash > 0 && ` + $${fromCash.toLocaleString()}`}
                  </Text>
                </Box>
                <Box>
                  <Text size="small" color="text-weak">Receiving:</Text>
                  <Text size="small">
                    {toTradeZone.length} player{toTradeZone.length !== 1 ? 's' : ''}
                    {toCash > 0 && ` + $${toCash.toLocaleString()}`}
                  </Text>
                </Box>
              </Box>
            </Box>
            <Box gap="xsmall" align="end">
              {validation.errors.length > 0 && (
                <Text size="xsmall" color="status-error">
                  {validation.errors[0]}
                </Text>
              )}
              <Button
                primary
                label={isSubmitting ? "Submitting..." : "Propose Trade"}
                onClick={handleSubmit}
                disabled={!validation.isValid || isSubmitting}
              />
            </Box>
          </Box>
        </Box>

        {/* Three column layout */}
        <Box direction="row" gap="small">
          {/* Your Roster - Left */}
          <Box flex basis="1/3">
            <DropZone id="from-roster" label={fromTeam?.name || "Your Team"}>
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
              {fromTeamLoading ? (
                <Spinner size="small" />
              ) : (
                fromRosterContracts.map(contract => (
                  <DraggablePlayerCard
                    key={contract.id}
                    contract={contract}
                    origin="from-roster"
                    isDragging={activeId === `from-roster-${contract.id}`}
                  />
                ))
              )}
            </DropZone>
          </Box>

          {/* Trade Zone - Center */}
          <Box flex basis="1/3">
            <DropZone id="trade-zone" label="Trade Zone">
              <Box gap="small">
                {fromTradeZone.length === 0 && toTradeZone.length === 0 ? (
                  <Box align="center" pad="large">
                    <Text color="text-weak" textAlign="center" size="small">
                      Drag players here to add them to the trade
                    </Text>
                  </Box>
                ) : (
                  <>
                    {fromTradeZone.length > 0 && (
                      <Box>
                        <Text size="small" weight="bold" color="text-weak" margin={{ bottom: "xxsmall" }}>
                          You're sending:
                        </Text>
                        {fromTradeZone.map(contract => (
                          <DraggablePlayerCard
                            key={contract.id}
                            contract={contract}
                            origin="from-roster"
                            isDragging={activeId === `from-roster-${contract.id}`}
                          />
                        ))}
                      </Box>
                    )}
                    {toTradeZone.length > 0 && (
                      <Box>
                        <Text size="small" weight="bold" color="text-weak" margin={{ bottom: "xxsmall" }}>
                          You're receiving:
                        </Text>
                        {toTradeZone.map(contract => (
                          <DraggablePlayerCard
                            key={contract.id}
                            contract={contract}
                            origin="to-roster"
                            isDragging={activeId === `to-roster-${contract.id}`}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </DropZone>
          </Box>

          {/* Their Roster - Right */}
          <Box flex basis="1/3">
            <Box
              background="light-1"
              round="small"
              border={{ color: "border", size: "xsmall" }}
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
                  <DropZone id="to-roster" label="">
                    {toTeamLoading ? (
                      <Spinner size="small" />
                    ) : (
                      toRosterContracts.map(contract => (
                        <DraggablePlayerCard
                          key={contract.id}
                          contract={contract}
                          origin="to-roster"
                          isDragging={activeId === `to-roster-${contract.id}`}
                        />
                      ))
                    )}
                  </DropZone>
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
      </Box>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeContract ? (
          <Box
            background="white"
            round="xsmall"
            pad="small"
            border={{ color: "brand", size: "small" }}
            elevation="large"
            style={{ opacity: 0.9, cursor: 'grabbing' }}
          >
            <Box direction="column" gap="xxsmall">
              <PlayerName name={activeContract.player.name} bbrefid={activeContract.player.bbrefid} />
              <Text size="xsmall" color="text-weak">
                {activeContract.player.position} • <CurrencyFormat
                  value={activeContract.amount}
                  displayType={"text"}
                  thousandSeparator={true}
                  prefix={"$"}
                /> • {activeContract.lastSeason.name}
              </Text>
            </Box>
          </Box>
        ) : null}
      </DragOverlay>

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
    </DndContext>
  );
}

export default DragDropTradeBuilder;
