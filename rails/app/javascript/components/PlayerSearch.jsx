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

      <DataTable
        placeholder={loading ? "Loading" : ""}
        sortable={false}
        fill
        border
        background={{
          header: "dark-2",
          body: ["white", "light-2"],
        }}
        primaryKey="id"
        columns={[
          {
            property: 'name',
            header: <Text>Name</Text>,
            render: (player) => (
              <Anchor href={player.bbrefLink} label={player.name} target="_blank" />
            )
          },
          {
            property: 'position',
            header: <Text>Position</Text>
          },
          {
            property: 'contract.lastSeason.name',
            header: <Text>Contract Ends</Text>,
            render: (player) => (
              <Text>{player.contract ? player.contract.lastSeason.name : "Free Agent"}</Text>
            )
          },
          {
            property: 'contract.amount',
            header: <Text>Amount</Text>,
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
            header: <Text>Team</Text>,
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
  )
}
