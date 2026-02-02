import React, { useState } from "react";
import { useManualQuery, useQuery } from "graphql-hooks";
import {
  Box,
  DataTable,
  TextInput,
  Text,
  Spinner,
  Tab,
  Tabs,
  Anchor
} from "grommet";
import CurrencyFormat from "react-currency-format";
import { DATA_TABLE_THEME } from "../constants/ui";

const POSITION_PLAYER_LIST_QUERY = `
query PositionPlayerListQuery($position: String!) {
  players(position: $position) {
    id
    bbrefLink
    name
    position
    contract {
      lastSeason {
        name
      }
      amount
      team {
        name
      }
    }
  }
}
`;


export default function PlayerSearch() {
  const positions = ["SP", "RP", "C", "1B", "2B", "3B", "SS", "OF"];
  const [index, setIndex] = useState(0);
  const onActive = (nextIndex) => {
    setIndex(nextIndex);
  }
  return (
    <Box gap="small">
      <Tabs activeIndex={index} onActive={onActive}>
        {positions.map((position) => (
          <Tab title={position} key={position}>
            <PlayerPositionSearchTable position={position} />
          </Tab>
        ))}
      </Tabs>
    </Box>
  )
}

const PlayerPositionSearchTable = ({ position }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { loading, error, data = { players: null } } = useQuery(
    POSITION_PLAYER_LIST_QUERY,
    {
      variables: {
        position,
      },
    }
  );

  let { players } = data;
  if (!players) return <Spinner size="medium" alignSelf="center" />;

  return (
      <Box
        gap="small">
        <TextInput
          placeholder="Player name"
          value={searchTerm}
          onChange={event => {
            setSearchTerm(event.target.value)
          }}
          disabled={loading} />

      <Box round="small" overflow="hidden" border={{ color: "border", size: "xsmall" }}>
        <DataTable
          placeholder={loading ? "Loading" : ""}
          sortable={false}
          responsive
          fill
          background={DATA_TABLE_THEME.background}
        primaryKey="id"
        columns={[
          {
            property: 'name',
            header: "Name",
            render: (player) => (
              <Anchor href={player.bbrefLink} label={player.name} target="_blank" />
            )
          },
          {
            property: 'position',
            header: "Position"
          },
          {
            property: 'contract.lastSeason.name',
            header: "Contract Ends",
            render: (player) => (
              <Text>{player.contract ? player.contract.lastSeason.name : "Free Agent"}</Text>
            )
          },
          {
            property: 'contract.amount',
            header: "Amount",
            render: (player) => (
              <CurrencyFormat
                value={player.contract ? player.contract.amount : "0"}
                displayType={"text"}
                thousandSeparator={true}
                prefix={"$"}
              />
            )
          },
          {
            property: 'contract.team.name',
            header: "Team",
            render: (player) => (
              <Text>{player.contract ? player.contract.team.name : "No team"}</Text>
            )
          },
        ]}
        data={data.players.filter(player => {
          if (!searchTerm) { return true }
          return player.name.toLowerCase().includes(searchTerm.toLowerCase())
        })} />
      </Box>
    </Box>
  )
}
