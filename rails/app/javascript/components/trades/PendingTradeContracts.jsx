import React from "react";
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow, Text } from "grommet";
import CurrencyFormat from "react-currency-format";
export default function PendingTradeContracts({ contracts, cash }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell>
                        Name
                    </TableCell>
                    <TableCell>
                        Position
                    </TableCell>
                    <TableCell>
                        Annual Salary
                    </TableCell>
                    <TableCell>
                        Final Season
                    </TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {contracts.map((contract) =>
                    <TableRow key={contract.id}>
                        <TableCell>{contract.player.name}</TableCell>
                        <TableCell>{contract.player.position}</TableCell>
                        <TableCell>
                            <CurrencyFormat
                                value={contract.amount}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                            />
                        </TableCell>
                        <TableCell>{contract.lastSeason.name}</TableCell>
                    </TableRow>
                )}
            </TableBody>
            {cash > 0 &&
                <TableFooter>
                    <TableRow>
                        <TableCell>
                            <Text>Cash: &nbsp;</Text>
                            <CurrencyFormat
                                value={cash}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                            />
                        </TableCell>
                    </TableRow>
                </TableFooter>
            }
        </Table>
    );
}