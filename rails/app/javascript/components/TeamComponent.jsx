import React from "react";
import { useQuery } from "graphql-hooks";
import { useParams } from "react-router";
import CurrencyFormat from "react-currency-format";
import { Grid, Heading, Spinner, Box, DataTable, CheckBox, List } from "grommet";

import { MailOption } from "grommet-icons";

import TeamBudgetInfo from "./TeamBudgetInfo";
import { Link } from "react-router-dom";

const TEAM_QUERY = `
  query TeamQuery($id: ID!) {
    team(id: $id) {
      name
      budget
      availableCash
      totalPlayers
      currentPayroll
      unsalariedPlayers
      stadium
      primaryEmail
      user {
        name
      }
      currentContracts {
        player {
          name
          position
          bbrefid
        }
        firstSeason {
          name
        }
        lastSeason {
          name
        }
        amount
        summer
        franchise
      }
    }
  }
`;
function TeamComponent(props) {
  const { id } = useParams();
  const { loading, error, data = { team: null }, refetch: refetchTeams } = useQuery(
    TEAM_QUERY,
    {
      variables: { id },
    }
  );

  if (loading) return <Spinner size="medium" />;

  if (error) {
    console.error("TeamComponent GraphQL Error:", error);
    console.error("URL param id:", id);
    console.error("Query variables:", { id });
    return (
      <Box pad="medium">
        <Heading level="3" color="status-error">Error loading team</Heading>
        <p>Error: {JSON.stringify(error, null, 2)}</p>
        <p>Team ID from URL: {id || "undefined"}</p>
      </Box>
    );
  }

  let { team } = data;
  if (!team) {
    return (
      <Box pad="medium">
        <Heading level="3">Team not found</Heading>
        <p>The team you're looking for doesn't exist.</p>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        gap="xxsmall"
        pad="small"
        elevation="small"
        border={{
          side: "all",
          color: "border",
          size: "xsmall",
        }}
      >
              <Heading level="3" margin="none">
                {team.name}
              </Heading>
              {team.user && team.primaryEmail && (
                <a href={`mailto:${team.primaryEmail}`}>
                  <MailOption />
                  {team.user.name}
                </a>
              )}
              <Heading level="4">
                {team.stadium}
              </Heading>
            
          <TeamBudgetInfo team={team} />
        </Box>
      <Box gridArea="players" background="light-2" pad="xsmall">
        <DataTable
          columns={[
            {
              property: "player.name",
              header: "Name",
              primary: true,
              sortable: true,
              render: (contract) => contract.player.name
            },
            {
              property: "player.position",
              header: "Position",
              sortable: true,
              render: (contract) => contract.player.position,
            },
            {
              property: "amount",
              header: "Annual Amount",
              sortable: true,
              render: (contract) => (
                <CurrencyFormat
                  value={contract.amount}
                  thousandSeparator={true}
                  prefix={"$"}
                  displayType={"text"}
                />
              ),
            },

            {
              property: "lastSeason.name",
              header: "Final Season",
              sortable: true,
              render: (contract) => contract.lastSeason?.name,
            },
            { 
              property: "summer",
              header: "Summer Draftee",
              sortable: true,
              render: (contract) => (
                <CheckBox checked={contract.summer} />
              )
            },
            {  
              property: "franchise",
              header: "Franchise Player",
              sortable: true,
              render: (contract) => (
                <CheckBox checked={contract.franchise} />
              )
            }
          ]}
          data={team.currentContracts}
          sortable={true}
          fill
          border
          background={{
            header: "dark-2",
            body: ["white", "light-2"],
          }}
        />
      </Box>
      </Box>
  );
}

export default TeamComponent;
