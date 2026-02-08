import React from "react";

import CurrencyFormat from "react-currency-format";

import { Box, Text } from "grommet";

function TeamBudgetInfo({ team }) {
  return (
    <Box>
      <Text size="medium" style={{ lineHeight: '1.8' }}>
        <Text color="text-weak">Budget: </Text>
        <Text weight="bold">
          <CurrencyFormat
            value={team.budget}
            displayType={"text"}
            thousandSeparator={true}
            prefix={"$"}
          />
        </Text>
        {"  |  "}
        <Text color="text-weak">Payroll: </Text>
        <Text weight="bold">
          <CurrencyFormat
            value={team.currentPayroll}
            displayType={"text"}
            thousandSeparator={true}
            prefix={"$"}
          />
        </Text>
        {"  |  "}
        <Text color="text-weak">Available: </Text>
        <Text weight="bold">
          <CurrencyFormat
            value={team.availableCash}
            displayType={"text"}
            thousandSeparator={true}
            prefix={"$"}
          />
        </Text>
        {"  |  "}
        <Text color="text-weak">Players: </Text>
        <Text weight="bold">{team.totalPlayers}</Text>
        {"  |  "}
        <Text color="text-weak">Unsalaried: </Text>
        <Text weight="bold">{team.unsalariedPlayers}</Text>
      </Text>
    </Box>
  );
}

export default TeamBudgetInfo;
