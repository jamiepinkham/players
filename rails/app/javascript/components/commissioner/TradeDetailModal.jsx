import React from "react";
import { Box, Layer, Heading, Text, Button } from "grommet";
import { Close } from "grommet-icons";
import CurrencyFormat from "react-currency-format";

const TradeDetailModal = ({ trade, onClose, onReject, isRejecting }) => {
  if (!trade) return null;

  const fromContracts = trade.fromContracts || [];
  const toContracts = trade.toContracts || [];
  const totalFromValue = fromContracts.reduce((sum, c) => sum + c.amount, 0) + (trade.toCash || 0);
  const totalToValue = toContracts.reduce((sum, c) => sum + c.amount, 0) + (trade.fromCash || 0);

  return (
    <Layer
      position="center"
      onEsc={onClose}
      onClickOutside={onClose}
    >
      <Box width="large" pad="medium" gap="small" overflow="auto">
        {/* Header */}
        <Box direction="row" justify="between" align="center">
          <Heading level={3} margin="none">
            Trade Details
          </Heading>
          <Button icon={<Close />} onClick={onClose} plain />
        </Box>

        {/* Trade Overview */}
        <Box
          background="light-2"
          pad="medium"
          round="small"
          gap="small"
        >
          <Box direction="row" justify="between" align="center">
            <Text size="large" weight="bold">
              {trade.fromTeam} ⇄ {trade.toTeam}
            </Text>
            <Box
              background={
                trade.status === 'pending' ? 'status-warning' :
                trade.status === 'accepted' ? 'status-ok' :
                'status-error'
              }
              pad={{ horizontal: "small", vertical: "xsmall" }}
              round="small"
            >
              <Text size="small" weight="bold" color="white">
                {trade.status?.toUpperCase() || 'PENDING'}
              </Text>
            </Box>
          </Box>
          <Text size="small" color="dark-6">
            Submitted {trade.timeAgo}
          </Text>
        </Box>

        {/* Trade Details - Two Column Layout */}
        <Box direction="row" gap="medium" margin={{ top: "small" }}>
          {/* From Team Column */}
          <Box flex border={{ side: "right" }} pad={{ right: "medium" }}>
            <Box
              background="brand"
              pad="small"
              round="small"
              margin={{ bottom: "small" }}
            >
              <Text weight="bold" color="white">
                {trade.fromTeam} Sends
              </Text>
            </Box>

            {fromContracts.length > 0 ? (
              <Box gap="xsmall">
                {fromContracts.map((contract, idx) => (
                  <Box
                    key={contract.id}
                    background={idx % 2 === 0 ? "white" : "light-1"}
                    pad="small"
                    round="xsmall"
                  >
                    <Text weight="bold">{contract.player}</Text>
                    <Text size="small" color="dark-6">
                      {contract.positions?.join(", ")}
                    </Text>
                    <Box direction="row" justify="between" margin={{ top: "xsmall" }}>
                      <Text size="small">
                        <CurrencyFormat
                          value={contract.amount}
                          displayType="text"
                          thousandSeparator={true}
                          prefix="$"
                        />
                      </Text>
                      {contract.lastSeason && (
                        <Text size="small" color="dark-6">
                          through {contract.lastSeason}
                        </Text>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Text size="small" color="dark-6">No players</Text>
            )}

            {trade.toCash > 0 && (
              <Box
                background="status-ok"
                pad="small"
                round="xsmall"
                margin={{ top: "small" }}
              >
                <Text weight="bold" color="white">
                  Cash
                </Text>
                <Text color="white">
                  <CurrencyFormat
                    value={trade.toCash}
                    displayType="text"
                    thousandSeparator={true}
                    prefix="$"
                  />
                </Text>
              </Box>
            )}

            <Box
              margin={{ top: "medium" }}
              pad="small"
              background="light-3"
              round="small"
            >
              <Text size="small" weight="bold">
                Total Value
              </Text>
              <Text>
                <CurrencyFormat
                  value={totalFromValue}
                  displayType="text"
                  thousandSeparator={true}
                  prefix="$"
                />
              </Text>
            </Box>
          </Box>

          {/* To Team Column */}
          <Box flex>
            <Box
              background="brand"
              pad="small"
              round="small"
              margin={{ bottom: "small" }}
            >
              <Text weight="bold" color="white">
                {trade.toTeam} Sends
              </Text>
            </Box>

            {toContracts.length > 0 ? (
              <Box gap="xsmall">
                {toContracts.map((contract, idx) => (
                  <Box
                    key={contract.id}
                    background={idx % 2 === 0 ? "white" : "light-1"}
                    pad="small"
                    round="xsmall"
                  >
                    <Text weight="bold">{contract.player}</Text>
                    <Text size="small" color="dark-6">
                      {contract.positions?.join(", ")}
                    </Text>
                    <Box direction="row" justify="between" margin={{ top: "xsmall" }}>
                      <Text size="small">
                        <CurrencyFormat
                          value={contract.amount}
                          displayType="text"
                          thousandSeparator={true}
                          prefix="$"
                        />
                      </Text>
                      {contract.lastSeason && (
                        <Text size="small" color="dark-6">
                          through {contract.lastSeason}
                        </Text>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Text size="small" color="dark-6">No players</Text>
            )}

            {trade.fromCash > 0 && (
              <Box
                background="status-ok"
                pad="small"
                round="xsmall"
                margin={{ top: "small" }}
              >
                <Text weight="bold" color="white">
                  Cash
                </Text>
                <Text color="white">
                  <CurrencyFormat
                    value={trade.fromCash}
                    displayType="text"
                    thousandSeparator={true}
                    prefix="$"
                  />
                </Text>
              </Box>
            )}

            <Box
              margin={{ top: "medium" }}
              pad="small"
              background="light-3"
              round="small"
            >
              <Text size="small" weight="bold">
                Total Value
              </Text>
              <Text>
                <CurrencyFormat
                  value={totalToValue}
                  displayType="text"
                  thousandSeparator={true}
                  prefix="$"
                />
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Trade Summary */}
        <Box
          margin={{ top: "small" }}
          pad="medium"
          background="light-1"
          round="small"
        >
          <Text weight="bold" margin={{ bottom: "xsmall" }}>
            Trade Summary
          </Text>
          <Text size="small">{trade.summary}</Text>
        </Box>

        {/* Value Analysis */}
        <Box
          pad="medium"
          background={Math.abs(totalFromValue - totalToValue) > 1000000 ? "status-warning" : "status-ok"}
          round="small"
        >
          <Text weight="bold" color="white">
            Value Difference
          </Text>
          <Text color="white">
            <CurrencyFormat
              value={Math.abs(totalFromValue - totalToValue)}
              displayType="text"
              thousandSeparator={true}
              prefix="$"
            />
          </Text>
          {Math.abs(totalFromValue - totalToValue) > 1000000 && (
            <Text size="small" color="white" margin={{ top: "xsmall" }}>
              ⚠️ Significant value imbalance
            </Text>
          )}
        </Box>

        {/* Action Buttons */}
        <Box
          direction="row"
          gap="small"
          justify="end"
          margin={{ top: "medium" }}
          pad={{ top: "small" }}
          border={{ side: "top" }}
        >
          <Button label="Close" onClick={onClose} />
          {trade.status === 'pending' && (
            <Button
              label={isRejecting ? "Rejecting..." : "Reject Trade"}
              color="status-error"
              primary
              onClick={() => onReject(trade.id)}
              disabled={isRejecting}
            />
          )}
        </Box>
      </Box>
    </Layer>
  );
};

export default TradeDetailModal;
