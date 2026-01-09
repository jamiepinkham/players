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
  return (
    <Box gap="medium" pad="medium" background="light-3" border={{ color: 'border' }} round="small">
      <Heading level={3} margin="none">Trade Summary</Heading>

      <Box direction="row" gap="large" justify="between">

        {/* Your team sends */}
        <Box gap="xsmall" flex>
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
        </Box>

        {/* Partner team sends */}
        {toTeam && (
          <Box gap="xsmall" flex>
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
          </Box>
        )}
      </Box>

      <Box direction="row" gap="medium" align="center">
        {/* Validation errors */}
        {validation.errors.length > 0 && (
          <Box pad="small" background="status-error" round="small" flex>
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
    </Box>
  );
}

export default TradeSummary;
