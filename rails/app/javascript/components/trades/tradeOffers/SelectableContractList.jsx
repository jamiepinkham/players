import React from "react";
import { useQuery } from "graphql-hooks";
import { Text, Spinner, CheckBox, DataTable, Box } from "grommet";
import CurrencyFormat from "react-currency-format";
import PlayerName from "../../PlayerName";
import { DATA_TABLE_THEME } from "../../../constants/ui";

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

  return (
    <Box round="small" overflow="hidden" border={{ color: "border", size: "xsmall" }}>
      <DataTable
        primaryKey='id'
        background={DATA_TABLE_THEME.background}
        size='medium'
      data={
        data.team.currentContracts.sort((lhs, rhs) => {
          if (lhs.player.name.toUpperCase() > rhs.player.name.toUpperCase()) {
            return 1;
          } else {
            return -1;
          }
        }) ?? []
      }
      columns={[
        {
          sortable: true,
          header: "Player",
          property: 'player.name',
          render: item => (
            <CheckBox
              label={<PlayerName name={item.player.name} bbrefid={item.player.bbrefid} />}
              value={item.id}
              checked={selectedContracts.some(c => c.id === item.id)}
              disabled={!item.player.isTradeEligible}
              onChange={(event) => {
                onToggle(item, event.target.checked);
              }}
            />
          )
        },
        {
          property: 'amount',
          header: "Annual Amount",
          render: item => (
            <CurrencyFormat
              value={item.amount}
              displayType={"text"}
              thousandSeparator={true}
              prefix={"$"} />
          )
        },
        {
          property: 'lastSeason.name',
          header: "Final Season"
        },
        {
          property: 'player.isTradeEligible',
          header: "Eligible",
          render: item => (
            <Text color={item.player.isTradeEligible ? 'status-ok' : 'status-error'}>
              {item.player.isTradeEligible ? 'Yes' : 'No'}
            </Text>
          )
        }
      ]}
      />
    </Box>
  );
}

export default SelectableContractList;
