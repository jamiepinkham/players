import React from "react";

import CurrencyFormat from "react-currency-format";

import { Box, Grid, Text } from "grommet";

function TeamBudgetInfo({ team }) {
  const StatBox = ({ label, value }) => (
    <Box>
      <Text size="small" color="text-weak">{label}</Text>
      <Text weight="bold">{value}</Text>
    </Box>
  );

  return (
    <Grid columns={{ count: 3, size: "auto" }} gap="small">
      <StatBox
        label="Budget"
        value={<CurrencyFormat
          value={team.budget}
          displayType={"text"}
          thousandSeparator={true}
          prefix={"$"}
        />}
      />
      <StatBox
        label="Payroll"
        value={<CurrencyFormat
          value={team.currentPayroll}
          displayType={"text"}
          thousandSeparator={true}
          prefix={"$"}
        />}
      />
      <StatBox
        label="Available"
        value={<CurrencyFormat
          value={team.availableCash}
          displayType={"text"}
          thousandSeparator={true}
          prefix={"$"}
        />}
      />
      <StatBox
        label="Players"
        value={team.totalPlayers}
      />
      <StatBox
        label="Unsalaried"
        value={team.unsalariedPlayers}
      />
    </Grid>
  );
}

export default TeamBudgetInfo;
