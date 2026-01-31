import React, { useState } from "react";
import { useQuery } from "graphql-hooks";
import { Text, Spinner, List, CheckBox, Box, FormField, DataTable } from "grommet";

import CurrencyFormat from "react-currency-format";
import PlayerName from "../PlayerName";

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

function TeamContractList({ team, onContractChecked }) {
  if (!team) return null;

  const { data = { contracts: null }, refetch: refetch } = useQuery(
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
            <CheckBox label={<PlayerName name={item.player.name} bbrefid={item.player.bbrefid} />} value={item.id} disabled={!item.player.isTradeEligible} onChange={(change) => {
              onContractChecked(item, change.target.checked)
            }} />
          )
        },
        {
          property: 'amount',
          header: <Text>Annual Contract Amount</Text>,
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
          header: <Text>Contract Final Season</Text>
        }
      ]}
    />
  );
}

export default TeamContractList;
