import React, { useState } from "react";

import { useMutation, useQuery } from "graphql-hooks";

import CurrencyFormat from "react-currency-format";

import CurrencyInput from "./CurrencyInput";
import PositionPlayerStatsTable from "./PositionPlayerStatsTable";
import PlayerName from "./PlayerName";
import LoadingState from "./LoadingState";
import { DATA_TABLE_THEME } from "../constants/ui";

const PLAYER_CONTRACT_MINIMUMS_QUERY = `
query PlayerContractMimimumsQuery($playerId: ID!) {
    player(id: $playerId) {
      contractMinimums {
        season {
          name
          id
        }
        amount
        duration
      }
    }
  }
`;


const CREATE_BID_MUTATION = `
mutation CreateBid($input: CreateBidMutationInput!) {
    createBid(input: $input) {
        bid {
            id
        }
        errors
    }
}
`

import {
  Box,
  Heading,
  Select,
  Spinner,
  DataTable,
  Button,
  Grid,
  Form,
  FormField,
  Text,
} from "grommet";

export default function PlaceBidComponent({ player, teamId, onBidCreated }) {
  const [annualAmount, setAnnualAmount] = useState(0);
  const [selectedSeasonOption, setSelectedSeasonOption] = useState({
    value: 0,
    label: "",
    minimum: 0,
    numberOfYears: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    loading,
    error,
    data = { player: null },
  } = useQuery(PLAYER_CONTRACT_MINIMUMS_QUERY, {
    variables: {
      playerId: player.id,
    },
  });

  const [createBidMutation] = useMutation(CREATE_BID_MUTATION);

  function isValidBid() {
    if (selectedSeasonOption.value == 0) {
      return false;
    }
    if (
      annualAmount >=
      selectedSeasonOption.minimum
    ) {
      return true;
    } else {
      return false;
    }
  }
  if (loading) return <LoadingState message="Loading player details..." />;
  return (
    <Box direction="column" pad="small" overflow="scroll">
      <Box direction="row" gap="xsmall" align="center">
        <Heading level={3} margin="none">Bidding on:</Heading>
        <Heading level={3} margin="none">
          <PlayerName name={player.name} bbrefid={player.bbrefid} />
        </Heading>
      </Box>
      <PositionPlayerStatsTable players={[player]} position={player.position} />

      <Grid
        background="light-4"
        pad="small"
        rows={[
          { count: "fit", size: "small" },
          { count: "fit", size: "small" },
        ]}
        columns={["medium"]}
        gap="small"
        areas={[
          { name: "minimums", start: [0, 0], end: [1, 0] },
          { name: "fields", start: [0, 1], end: [1, 1] },
        ]}
      >
        <Box gridArea="minimums" pad="xsmall">
          <Box round="small" overflow="hidden" border={{ color: "border", size: "xsmall" }}>
            <DataTable
                  pad="xsmall"
                  margin="none"
                  background={DATA_TABLE_THEME.background}
                  columns={[
                  {
                    property: "duration",
                    header: "Contract Length",
                    render: (mimimum) => (
                      <Text>{mimimum.duration + " season(s)"}</Text>
                    )
                  },
                  {
                    property: "amount",
                    header: "Minimum Annual Amount",
                    render: (mimimum) => (
                      <CurrencyFormat
                        value={mimimum.amount}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                      />
                    ),
                  },
                ]}
                data={data.player.contractMinimums}
                />
            </Box>
          </Box>

        <Box
          direction="column"
          gap="xxsmall"
          alignContent="center"
          pad="xxsmall"
          gridArea="fields"
        >
          <Box gridArea="fields" pad="xsmall">
                <Form pad="xxsmall">
                  <FormField label="Duration">
                    <Select
                      margin="xxsmall"
                      options={data.player.contractMinimums.map(
                        (item, index) => {
                          return {
                            value: parseInt(item.season.id),
                            label: `${
                                (index + 1 == 1 ? 
                                `${index + 1} season` : 
                                `${index + 1} seasons`
                                )}`
                            ,
                            minimum: parseInt(item.amount),
                            numberOfYears: index + 1,
                          };
                        }
                      )}
                      labelKey="label"
                      valueKey="value"
                      value={selectedSeasonOption}
                      onChange={(event) => {
                        setAnnualAmount(event.option.minimum);
                        setSelectedSeasonOption(event.option);
                      }}
                    />
                  </FormField>
                  <FormField label="Annual Amount">
                    <CurrencyInput
                      value={annualAmount}
                      placeholder={""}
                      onChange={(change) => {
                        setAnnualAmount(parseInt(change.target.value) || 0);
                      }}
                    />
                  </FormField>

                  <FormField label="Total Contract Value">
                    <CurrencyInput
                      value={annualAmount * selectedSeasonOption.numberOfYears}
                      disabled={true}
                      placeholder={""}
                    />
                  </FormField>
                </Form>
                <Box align="end">
                  <Button
                    onClick={async () => {
                        setIsSubmitting(true);
                        try {
                            let bid = {
                                teamId: teamId,
                                playerId: player.id,
                                annualAmount: annualAmount,
                                finalSeasonId: selectedSeasonOption.value,
                            };
                            await createBidMutation({variables: {"input": bid}})
                            // Dispatch custom event to notify App component to refresh notifications
                            window.dispatchEvent(new CustomEvent('bidPlaced'));
                            onBidCreated()
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                    disabled={!isValidBid() || isSubmitting}
                    icon={isSubmitting ? <Spinner size="xsmall" /> : undefined}
                    label={isSubmitting ? "Placing..." : "Place Bid"}
                  />
                </Box>
              </Box>
        </Box>
      </Grid>
    </Box>
  );
}
