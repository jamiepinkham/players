import React from "react";
import { useQuery } from "graphql-hooks";
import { Text, Spinner, CheckBox, DataTable } from "grommet";
import CurrencyFormat from "react-currency-format";

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

  const { data = { team: null } } = useQuery(
    TEAM_CONTRACTS_QUERY,
    {
      variables: {
        teamId: team.id,
      },
    }
  );

  if (!data.team) return <Spinner size="medium" alignSelf="center" />;

  return (
    <DataTable
      primaryKey='id'
      background={['light-1', 'light-2']}
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
          header: <Text>Player</Text>,
          property: 'player.name',
          render: item => (
            <CheckBox
              label={item.player.name}
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
          header: <Text>Annual Amount</Text>,
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
          header: <Text>Final Season</Text>
        },
        {
          property: 'player.isTradeEligible',
          header: <Text>Eligible</Text>,
          render: item => (
            <Text color={item.player.isTradeEligible ? 'status-ok' : 'status-error'}>
              {item.player.isTradeEligible ? 'Yes' : 'No'}
            </Text>
          )
        }
      ]}
    />
  );
}

export default SelectableContractList;
