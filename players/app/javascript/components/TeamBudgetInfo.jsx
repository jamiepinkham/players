import React from "react";

import CurrencyFormat from "react-currency-format";

import { Table, Text, TableBody, TableHeader, TableCell, TableRow } from "grommet";

function TeamBudgetInfo({ team }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell>
            <Text>Total Budget</Text>
          </TableCell>
          <TableCell>
            <Text>Total Payroll</Text>
          </TableCell>
          <TableCell>
            <Text>Available Cash</Text>
          </TableCell>
          <TableCell>
            <Text>Total Players</Text>
          </TableCell>
          <TableCell>
            <Text>Unsalaried Players</Text>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
      <TableRow>
        <TableCell>
        <CurrencyFormat
          value={team.budget}
          displayType={"text"}
          thousandSeparator={true}
          prefix={"$"}
        />
        </TableCell>
        <TableCell>
        <CurrencyFormat
          value={team.currentPayroll}
          displayType={"text"}
          thousandSeparator={true}
          prefix={"$"}
        />
        </TableCell>
        <TableCell>
        <CurrencyFormat
          value={team.availableCash}
          displayType={"text"}
          thousandSeparator={true}
          prefix={"$"}
        />
        </TableCell>
        <TableCell>
          <Text>{team.totalPlayers}</Text>
        </TableCell>
        <TableCell>
          <Text>{team.unsalariedPlayers}</Text>
        </TableCell>
      </TableRow>
      </TableBody>
    </Table>
  );
}

export default TeamBudgetInfo;
