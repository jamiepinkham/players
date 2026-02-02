import React from "react";
import { Box, Text } from "grommet";
import CurrencyFormat from "react-currency-format";
import PlayerName from "../PlayerName";

export default function PendingTradeContracts({ contracts, cash }) {
    if (contracts.length === 0 && (!cash || cash === 0)) {
        return <Text size="small" color="text-weak">Nothing</Text>;
    }

    return (
        <Box gap="xxsmall">
            {contracts.map((contract, idx) => (
                <Box
                    key={contract.id}
                    direction="row"
                    justify="between"
                    align="center"
                    pad={{ horizontal: "small", vertical: "xsmall" }}
                    background={idx % 2 === 0 ? "white" : "light-1"}
                    round="xsmall"
                >
                    <Box direction="row" gap="small" align="center">
                        <PlayerName name={contract.player.name} bbrefid={contract.player.bbrefid} />
                        <Text size="small" color="text-weak">({contract.player.position})</Text>
                    </Box>
                    <Box direction="row" gap="small" align="center">
                        <Text size="small">
                            <CurrencyFormat
                                value={contract.amount}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                            />
                        </Text>
                        <Text size="small" color="text-weak">
                            through {contract.lastSeason.name}
                        </Text>
                    </Box>
                </Box>
            ))}
            {cash > 0 && (
                <Box
                    direction="row"
                    justify="between"
                    align="center"
                    pad={{ horizontal: "small", vertical: "xsmall" }}
                    background="light-2"
                    round="xsmall"
                >
                    <Text weight="bold">Cash</Text>
                    <Text weight="bold">
                        <CurrencyFormat
                            value={cash}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                        />
                    </Text>
                </Box>
            )}
        </Box>
    );
}