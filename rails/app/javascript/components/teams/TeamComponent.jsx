import React from "react";
import { useQuery } from "graphql-hooks";
import { useParams } from "react-router";
import CurrencyFormat from "react-currency-format";
import { Grid, Heading, Box, DataTable, List, Text } from "grommet";

import { MailOption } from "grommet-icons";

import TeamBudgetInfo from "./TeamBudgetInfo";
import { Link } from "react-router-dom";
import PlayerName from "../players/PlayerName";
import LoadingState from "../common/LoadingState";
import { DATA_TABLE_THEME } from "../../constants/ui";

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
          id
          name
          positions
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

  if (loading) return <LoadingState message="Loading team data..." />;

  if (error) {
    return (
      <Box pad="medium">
        <Heading level="3" color="status-error">Error loading team</Heading>
        <p>{error.message || "Failed to load team data. Please try logging in again."}</p>
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
    <Box gap="medium">
      <Box
        pad="medium"
        elevation="small"
        background="light-1"
        round="small"
        border={{
          side: "all",
          color: "border",
          size: "xsmall",
        }}
      >
        <Box direction="row-responsive" justify="between" align="center" gap="xsmall" margin={{ bottom: "small" }}>
          <Text size="medium" color="text-weak">{team.stadium}</Text>
          {team.user && team.primaryEmail && (
            <Box direction="row" gap="xxsmall" align="center">
              <a href={`mailto:${team.primaryEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MailOption size="medium" />
                <Text size="medium">{team.user.name}</Text>
              </a>
            </Box>
          )}
        </Box>
        <TeamBudgetInfo team={team} />
      </Box>
      <Box round="small" border={{ color: "border", size: "xsmall" }}>
        <DataTable
          columns={[
            {
              property: "player.name",
              header: "Name",
              primary: true,
              sortable: true,
              render: (contract) => (
                <Box direction="row" align="center" gap="xsmall">
                  <PlayerName
                    playerId={contract.player.id}
                    name={contract.player.name}
                    bbrefid={contract.player.bbrefid}
                  />
                  {contract.summer && <Text size="xsmall" color="status-ok"> SUMMER</Text>}
                  {contract.franchise && <Text size="xsmall" color="brand"> FRANCHISE</Text>}
                </Box>
              )
            },
            {
              property: "player.positions",
              header: "Position",
              sortable: true,
              render: (contract) => contract.player.positions?.join(', ') || '',
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
            }
          ]}
          data={team.currentContracts}
          sortable={true}
          responsive
          background={DATA_TABLE_THEME.background}
        />
      </Box>
      </Box>
  );
}

export default TeamComponent;
