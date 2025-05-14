import React, { useState } from "react";
import { useQuery } from "graphql-hooks";
import { useAuth } from "../hooks/use_auth";
import {
  Heading,
  Box,
  Layer,
  Spinner,
  DataTable,
  Accordion,
  AccordionPanel,
  Text,
} from "grommet";

import PlayerLists from "./PlayerLists";
import TeamBudgetInfo from "./TeamBudgetInfo";
import PlaceBidComponent from "./PlaceBidComponent";
import CurrencyFormat from "react-currency-format";
import Moment from "react-moment";
import { max } from "moment-timezone";

const BIDDING_CONSOLE_QUERY = `
  query BiddingConsoleQuery($teamId: ID!) {
    team(id: $teamId) {
      id
      name
      budget
      currentPayroll
      availableCash
      unsalariedPlayers
      totalPlayers
    }
    currentSeason {
      activeFreeAgencyPeriod {
            id
            maxBidsForTeam
            bids(teamId: $teamId, active: true) {
                id
                isLeading
                createdAt
                player {
                    name
                }
                annualAmount
                lastSeason {
                    name
                }
            }
        }
        id
        name
    }
  }
`;

export default function BiddingConsole() {
  const auth = useAuth();
  const [show, setShow] = useState(null);
  const { data = { team: null, currentSeason: null }, refetch: refetch } =
    useQuery(BIDDING_CONSOLE_QUERY, {
      variables: {
        teamId: auth.teamId,
      },
    });
  if (!data.team) return <Spinner size="medium" alignSelf="center" />;
  const team = data.team;
  const currentSeason = data.currentSeason;
  const bids = currentSeason.activeFreeAgencyPeriod.bids
  const maxBids = currentSeason.activeFreeAgencyPeriod.maxBidsForTeam
  function onPlayerSelected(player) {
    if (bids.length < maxBids) {
      setShow(player);
    }
  }

  return (
    <Box>
      <Box margin="xxsmall">
        <Heading level={3} pad="xsmall">
          {team.name} Bidding Console
        </Heading>
        <TeamBudgetInfo team={team} />
      </Box>
      <Box>
        <Accordion>
          <AccordionPanel label={`Current Bids (${bids.length} of ${maxBids} used)`}>
            {bids.length > 0 ? (
              <DataTable
                columns={[
                  {
                    property: "player.name",
                    header: "Player",
                  },
                  {
                    property: "amount",
                    header: "Annual Amount",
                    render: (bid) => (
                      <CurrencyFormat
                        value={bid.annualAmount}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                      />
                    ),
                  },
                  {
                    property: "lastSeason.name",
                    header: "Final Season",
                  },
                  {
                    property: "createAt",
                    header: "Date placed",
                    render: (bid) => (
                        <Moment fromNow>{bid.createdAt}</Moment>
                    ),
                  },
                  {
                    property: "isLeading",
                    header: "Leading",
                    render: (bid) => (
                      <Text>{bid.isLeading ? "yes" : "no"}</Text>
                    ),
                  },
                ]}
                data={bids}
              />
            ) : (
              <Heading level={5} margin="xsmall">
                No bids
              </Heading>
            )}
          </AccordionPanel>
        </Accordion>
      </Box>
      <Box pad="xsmall">
        <Heading level={3} margin="xsmall">
          Players
        </Heading>
        <PlayerLists onPlayerSelected={onPlayerSelected} />
        {show && (
          <Layer
            onEsc={() => setShow(null)}
            onClickOutside={() => setShow(null)}
            modal={true}
            animation="fadeIn"
            margin="small"
          >
            <PlaceBidComponent
              player={show}
              teamId={team.id}
              onBidCreated={() => {
                refetch({ teamId: team.id });
                setShow(null);
              }}
            />
          </Layer>
        )}
      </Box>
    </Box>
  );
}
