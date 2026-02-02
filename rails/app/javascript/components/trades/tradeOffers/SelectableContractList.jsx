import React from "react";
import { useQuery } from "graphql-hooks";
import { Text, Spinner, CheckBox, Box } from "grommet";
import CurrencyFormat from "react-currency-format";
import PlayerName from "../../PlayerName";

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

function SelectableContractList({ team, selectedContracts = [], onToggle }) {
  if (!team) return null;

  const { data, loading, error } = useQuery(
    TEAM_CONTRACTS_QUERY,
    {
      variables: {
        teamId: team.id,
      },
    }
  );

  if (loading) return <Spinner size="medium" alignSelf="center" />;
  if (error) return <Text color="status-critical">Error loading contracts: {error.message}</Text>;
  if (!data?.team) return <Text color="status-critical">Team not found</Text>;

  const formatPlayerStats = (player) => {
    const stats = {};
    player.stats.forEach(stat => {
      stats[stat.title] = stat.value;
    });
    return stats;
  };

  const sortedContracts = (data.team.currentContracts || []).sort((lhs, rhs) => {
    if (lhs.player.name.toUpperCase() > rhs.player.name.toUpperCase()) {
      return 1;
    } else {
      return -1;
    }
  });

  return (
    <Box round="small" overflow="hidden" border={{ color: "border", size: "xsmall" }}>
      {sortedContracts.length === 0 ? (
        <Box pad="medium" align="center">
          <Text color="text-weak">No contracts available</Text>
        </Box>
      ) : (
        sortedContracts.map((contract, idx) => {
          const stats = formatPlayerStats(contract.player);
          const isPitcher = contract.player.position === "SP" || contract.player.position === "RP";
          const isSelected = selectedContracts.some(c => c.id === contract.id);
          const isEligible = contract.player.isTradeEligible;

          return (
            <Box
              key={contract.id}
              direction="row"
              align="center"
              pad="xsmall"
              gap="xsmall"
              background={idx % 2 === 0 ? "white" : "light-1"}
              border={idx < sortedContracts.length - 1 ? { side: "bottom", color: "border", size: "hair" } : undefined}
              style={{ opacity: isEligible ? 1 : 0.5 }}
            >
              <CheckBox
                checked={isSelected}
                disabled={!isEligible}
                onChange={(event) => {
                  onToggle(contract, event.target.checked);
                }}
              />
              <Box flex direction="column" gap="xxsmall">
                <Box direction="row" justify="between" align="center">
                  <PlayerName name={contract.player.name} bbrefid={contract.player.bbrefid} bold={isSelected} />
                  {!isEligible && contract.player.tradeIneligibilityReason && (
                    <Text size="xsmall" color="status-error" weight="bold">
                      {contract.player.tradeIneligibilityReason}
                    </Text>
                  )}
                  {!isEligible && !contract.player.tradeIneligibilityReason && (
                    <Text size="xsmall" color="status-error" weight="bold">
                      Ineligible
                    </Text>
                  )}
                </Box>
                <Box direction="row" justify="between">
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
            </Box>
          );
        })
      )}
    </Box>
  );
}

export default SelectableContractList;
