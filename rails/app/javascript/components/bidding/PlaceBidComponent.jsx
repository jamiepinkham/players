import React, { useState } from "react";

import { useMutation, useQuery } from "graphql-hooks";

import CurrencyFormat from "react-currency-format";

import CurrencyInput from "../common/CurrencyInput";
import LoadingState from "../common/LoadingState";
import { FormDown, FormUp } from "grommet-icons";

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
      bids {
        id
        team {
          id
          name
        }
        annualAmount
        firstSeason {
          id
          name
        }
        lastSeason {
          name
        }
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
  Button,
  Form,
  Text,
  Card,
  CardBody,
  CardHeader,
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
  const [isContractDetailsExpanded, setIsContractDetailsExpanded] = useState(true);
  const annualAmountInputRef = React.useRef(null);
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

  function getAmountError() {
    if (selectedSeasonOption.value === 0) {
      return null;
    }
    if (annualAmount > 0 && annualAmount < selectedSeasonOption.minimum) {
      return `Minimum required: ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(selectedSeasonOption.minimum)}`;
    }
    return null;
  }
  if (loading) return <LoadingState message="Loading player details..." />;
  if (!data.player || !data.player.contractMinimums) {
    return <LoadingState message="Loading contract details..." />;
  }

  return (
    <Box direction="column" gap="small">
      <Box
        background="light-1"
        round="small"
        border={{ color: "border", size: "xsmall" }}
        overflow="hidden"
      >
        <Box
          direction="row"
          justify="between"
          align="center"
          pad="medium"
          onClick={() => setIsContractDetailsExpanded(!isContractDetailsExpanded)}
          style={{ cursor: 'pointer' }}
          hoverIndicator
        >
          <Text weight="bold">Contract Details</Text>
          {isContractDetailsExpanded ? <FormUp /> : <FormDown />}
        </Box>
        {isContractDetailsExpanded && (
          <Box
            pad="medium"
            border={{ side: "top", color: "border", size: "xsmall" }}
            gap="medium"
          >
            <Form gap="medium">
                  <Box direction="row" align="center" gap="medium">
                    <Box width="140px">
                      <Text weight="bold">Final Season:</Text>
                    </Box>
                    <Box flex background="white" round="xsmall" border={{ color: "border", size: "small" }}>
                      <Select
                        placeholder="Select final season"
                        plain
                        options={data.player.contractMinimums.map(
                          (item, index) => {
                            return {
                              value: parseInt(item.season.id),
                              label: `${item.season.name} - ${item.duration} ${item.duration === 1 ? 'season' : 'seasons'}`,
                              minimum: parseInt(item.amount),
                              numberOfYears: index + 1,
                            };
                          }
                        )}
                        labelKey="label"
                        valueKey="value"
                        value={selectedSeasonOption.value > 0 ? selectedSeasonOption : undefined}
                        onChange={(event) => {
                          setAnnualAmount(event.option.minimum);
                          setSelectedSeasonOption(event.option);
                          // Focus the annual amount input after selecting duration
                          setTimeout(() => {
                            annualAmountInputRef.current?.focus();
                          }, 100);
                        }}
                      />
                    </Box>
                  </Box>

                  <Box gap="xxsmall" opacity={selectedSeasonOption.value > 0 ? 1 : 0.5}>
                    <Box direction="row" align="center" gap="medium">
                      <Box width="140px">
                        <Text weight="bold">Annual Amount:</Text>
                      </Box>
                      <Box flex background="white" round="xsmall" border={{ color: "border", size: "small" }} style={{ overflow: "hidden" }}>
                        <CurrencyInput
                          ref={annualAmountInputRef}
                          value={annualAmount}
                          placeholder={""}
                          plain
                          disabled={selectedSeasonOption.value === 0}
                          onChange={(change) => {
                            setAnnualAmount(parseInt(change.target.value) || 0);
                          }}
                        />
                      </Box>
                    </Box>
                    <Box direction="row" gap="medium" pad={{ left: "156px" }}>
                      {selectedSeasonOption.value > 0 ? (
                        <>
                          <Text size="small" color="text-weak">
                            Minimum: {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(selectedSeasonOption.minimum)}
                          </Text>
                          {getAmountError() && (
                            <Text size="small" color="status-error">{getAmountError()}</Text>
                          )}
                        </>
                      ) : (
                        <Text size="small" color="text-weak">Select a duration first</Text>
                      )}
                    </Box>
                  </Box>

                  <Card
                    background="light-2"
                    pad="small"
                    margin={{ top: "small" }}
                    opacity={selectedSeasonOption.value > 0 && annualAmount > 0 ? 1 : 0.5}
                  >
                    <CardHeader pad="none">
                      <Text weight="bold" size="medium">Bid Summary</Text>
                    </CardHeader>
                    <CardBody pad={{ top: "xsmall" }} gap="xsmall">
                      <Box direction="row" justify="between">
                        <Text>Contract Length:</Text>
                        <Text weight="bold">
                          {selectedSeasonOption.numberOfYears > 0
                            ? `${selectedSeasonOption.numberOfYears} ${selectedSeasonOption.numberOfYears === 1 ? 'season' : 'seasons'}`
                            : '—'}
                        </Text>
                      </Box>
                      <Box direction="row" justify="between">
                        <Text>Annual Amount:</Text>
                        <Text weight="bold">
                          {annualAmount > 0 ? (
                            <CurrencyFormat
                              value={annualAmount}
                              displayType={"text"}
                              thousandSeparator={true}
                              prefix={"$"}
                            />
                          ) : '—'}
                        </Text>
                      </Box>
                      <Box
                        direction="row"
                        justify="between"
                        pad={{ top: "xsmall" }}
                        border={{ side: "top", color: "border" }}
                        margin={{ top: "xsmall" }}
                      >
                        <Text weight="bold" size="large">Total Contract Value:</Text>
                        <Text weight="bold" size="large" color={selectedSeasonOption.value > 0 && annualAmount > 0 ? "brand" : "text-weak"}>
                          {selectedSeasonOption.value > 0 && annualAmount > 0 ? (
                            <CurrencyFormat
                              value={annualAmount * selectedSeasonOption.numberOfYears}
                              displayType={"text"}
                              thousandSeparator={true}
                              prefix={"$"}
                            />
                          ) : '—'}
                        </Text>
                      </Box>
                    </CardBody>
                  </Card>
                  <Box direction="row" gap="small" justify="end" margin={{ top: "small" }}>
                    <Button
                      label="Cancel"
                      size="large"
                      onClick={onBidCreated}
                    />
                    <Button
                      primary
                      size="large"
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
                </Form>
          </Box>
        )}
      </Box>
    </Box>
  );
}
