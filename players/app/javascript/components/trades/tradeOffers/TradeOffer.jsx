import React from 'react';
import { Table, TableHeader, TableRow, TableBody, TableCell, Text } from 'grommet';
import CurrencyFormat from "react-currency-format";
import { List } from 'grommet-icons';

export default function TradeOffer({toTeam, toContracts, toCash, fromTeam, fromContracts, fromCash}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell>
                        <Text>Team</Text>
                    </TableCell>
                    <TableCell>
                        <Text>Players to send</Text>
                    </TableCell>
                    <TableCell>
                        <Text>Cash to send</Text>
                    </TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <Text>{fromTeam.name}</Text>
                    </TableCell>
                    <TableCell>
                    {fromContracts &&
                    
                        <Text color="text-strong">{fromContracts.map((contract) => contract.player.name + " ") }</Text>
                    }
                    </TableCell>
                    <TableCell>
                        { fromCash &&
                            <CurrencyFormat value={fromCash} displayType={"text"} thousandSeparator={true} prefix={"$"} />
                        }
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        {toTeam && 
                            <Text>{toTeam.name}</Text>
                        }
                    </TableCell>
                    <TableCell>
                    {toContracts &&
                        <Text color="text-strong">{toContracts.map((contract) => contract.player.name + " ") }</Text>
                    }
                    </TableCell>
                    <TableCell>
                    { toCash && 
                        <CurrencyFormat value={toCash} displayType={"text"} thousandSeparator={true} prefix={"$"} />
                    }
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    //     <Box direction="row">
    //         <Box width="medium">
    //             <NameValueList>
    //                 <NameValuePair name="From Team">
    //                     <Text color="text-strong">{fromTeam.name}</Text>
    //                 </NameValuePair>
    //             { (toContracts && toContracts.length > 0) && 
    //                 <NameValuePair name="From Players">
    //                     <Text color="text-strong">{fromContracts.map((contract) => contract.player.name + " ") }</Text>
    //                 </NameValuePair>
    //             }
    //             { fromCash && 
    //                 <NameValuePair name="From Cash">
    //                     <CurrencyFormat value={fromCash} displayType={"text"} thousandSeparator={true} prefix={"$"} />
    //                 </NameValuePair>
    //             }
    //             </NameValueList>
    //         </Box>
    //         <Box width="medium">
    //             <NameValueList>
    //             {toTeam && 
    //                 <NameValuePair name="To Team">
    //                     <Text color="text-strong">{toTeam.name}</Text>
    //                 </NameValuePair>
    //             }
    //             { (toContracts && toContracts.length > 0) && 
    //                 <NameValuePair name="To Players">
    //                     <Text color="text-strong">{toContracts.map((contract) => contract.player.name + " ") }</Text>
    //                 </NameValuePair>
    //             }
    //             { toCash && 
    //                 <NameValuePair name="To Cash">
    //                     <CurrencyFormat value={toCash} displayType={"text"} thousandSeparator={true} prefix={"$"} />
    //                 </NameValuePair>
    //             }
    //             </NameValueList>
    //         </Box>
    //   </Box>
    );
}