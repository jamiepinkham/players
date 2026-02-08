import React from "react";
import { useQuery } from "graphql-hooks";

import CurrencyFormat from "react-currency-format";

import { DataTable, Anchor, Box } from "grommet";
import LoadingState from "../common/LoadingState";
import { DATA_TABLE_THEME } from "../../constants/ui";

const LIST_TEAMS_QUERY = `
  query ListTeamsQuery {
    teams { 
      id
      name
      budget
      currentPayroll
      availableCash
      stadium 
    }
  }
`;

function TeamsList() {
  const { loading, data = { teams: [] }, refetch: refetchTeams } =
    useQuery(LIST_TEAMS_QUERY);

  if (loading) return <LoadingState message="Loading teams..." />;

  return (
    <Box round="small" border={{ color: "border", size: "xsmall" }}>
      <DataTable
      columns={[
        {
          property: "name",
          header: "Name",
          primary: true,
          sortable: true,
          render: (team) => (
            <Anchor href={`team/${team.id}`} label={team.name} />
          ),
        },
        {
          property: "budget",
          header: "Budget",
          sortable: true,
          render: (team) => (
            <CurrencyFormat
              value={team.budget}
              thousandSeparator={true}
              prefix={"$"}
              displayType={"text"}
            />
          ),
        },
        {
          property: "currentPayroll",
          header: "Current Payroll",
          sortable: true,
          render: (team) => (
            <CurrencyFormat
              value={team.currentPayroll}
              thousandSeparator={true}
              prefix={"$"}
              displayType={"text"}
            />
          ),
        },
        {
          property: "availableCash",
          header: "Available Cash",
          sortable: true,
          render: (team) => (
            <CurrencyFormat
              value={team.availableCash}
              thousandSeparator={true}
              prefix={"$"}
              displayType={"text"}
            />
          ),
        },
        {
          property: "stadium",
          header: "Stadium",
        },
      ]}
      data={data.teams}
      sortable={true}
      responsive
      background={DATA_TABLE_THEME.background}
      />
    </Box>
  );
}

export default TeamsList;
