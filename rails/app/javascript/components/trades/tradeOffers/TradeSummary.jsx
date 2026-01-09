import React from 'react';
import { Box, Heading, Text, Button } from 'grommet';
import CurrencyFormat from 'react-currency-format';

function TradeSummary({
  fromTeam,
  fromContracts = [],
  fromCash = 0,
  toTeam,
  toContracts = [],
  toCash = 0,
  validation = { isValid: false, errors: [] },
  onSubmit,
  isSubmitting = false
}) {
  // Calculate total values
  const fromTotalSalary = fromContracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const toTotalSalary = toContracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

  const fromTotalValue = fromTotalSalary + fromCash;
  const toTotalValue = toTotalSalary + toCash;

  const difference = Math.abs(fromTotalValue - toTotalValue);
  const isBalanced = difference < (fromTotalValue + toTotalValue) * 0.2; // 20% threshold

  return (
    <Box gap="small" pad="medium" background="light-3" border={{ color: 'border' }} round="small">
      <Heading level={3} margin="none">Trade Summary</Heading>

      {/* Your team sends */}
      <Box gap="xsmall">
        <Text weight="bold">{fromTeam ? fromTeam.name : 'Your Team'} sends:</Text>
        {fromContracts.length > 0 ? (
          fromContracts.map(c => (
            <Text key={c.id} size="small">
              • {c.player.name} (<CurrencyFormat
                value={c.amount}
                displayType="text"
                thousandSeparator
                prefix="$"
              />/yr)
            </Text>
          ))
        ) : (
          <Text size="small" color="text-weak">No players selected</Text>
        )}
        {fromCash > 0 && (
          <Text size="small">
            • Cash: <CurrencyFormat
              value={fromCash}
              displayType="text"
              thousandSeparator
              prefix="$"
            />
          </Text>
        )}
        <Text weight="bold" size="small">
          Total: <CurrencyFormat
            value={fromTotalValue}
            displayType="text"
            thousandSeparator
            prefix="$"
          />
        </Text>
      </Box>

      {/* Partner team sends */}
      {toTeam && (
        <Box gap="xsmall">
          <Text weight="bold">{toTeam.name} sends:</Text>
          {toContracts.length > 0 ? (
            toContracts.map(c => (
              <Text key={c.id} size="small">
                • {c.player.name} (<CurrencyFormat
                  value={c.amount}
                  displayType="text"
                  thousandSeparator
                  prefix="$"
                />/yr)
              </Text>
            ))
          ) : (
            <Text size="small" color="text-weak">No players selected</Text>
          )}
          {toCash > 0 && (
            <Text size="small">
              • Cash: <CurrencyFormat
                value={toCash}
                displayType="text"
                thousandSeparator
                prefix="$"
              />
            </Text>
          )}
          <Text weight="bold" size="small">
            Total: <CurrencyFormat
              value={toTotalValue}
              displayType="text"
              thousandSeparator
              prefix="$"
            />
          </Text>
        </Box>
      )}

      {/* Balance indicator */}
      {toTeam && (fromContracts.length > 0 || toContracts.length > 0 || fromCash > 0 || toCash > 0) && (
        <Box
          pad="small"
          background={isBalanced ? 'status-ok' : 'status-warning'}
          round="small"
        >
          <Text size="small">
            Value difference: <CurrencyFormat
              value={difference}
              displayType="text"
              thousandSeparator
              prefix="$"
            />
            {!isBalanced && ' (Consider balancing trade)'}
          </Text>
        </Box>
      )}

      {/* Validation errors */}
      {validation.errors.length > 0 && (
        <Box pad="small" background="status-error" round="small">
          {validation.errors.map((error, i) => (
            <Text key={i} color="white" size="small">• {error}</Text>
          ))}
        </Box>
      )}

      {/* Submit button */}
      <Button
        primary
        label={isSubmitting ? "Submitting..." : "Submit Trade Proposal"}
        onClick={onSubmit}
        disabled={!validation.isValid || isSubmitting}
      />
    </Box>
  );
}

export default TradeSummary;
