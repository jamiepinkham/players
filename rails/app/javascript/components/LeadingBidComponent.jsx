import React, { useState, useRef } from 'react';

import {
    Box,
    Text,
    Drop
} from 'grommet';

import { Currency } from 'grommet-icons';
import CurrencyFormat from 'react-currency-format';

export default function LeadingBidComponent({player}) {
    const bid = player.bids ? player.bids[0] : null;
    const [showDrop, setShowDrop] = useState(false);
    const targetRef = useRef();

    return (
        <Box>
            <Box
                ref={targetRef}
                onMouseEnter={() => setShowDrop(true)}
                onMouseLeave={() => setShowDrop(false)}
                style={{ cursor: bid ? 'help' : 'default' }}
            >
                <Currency color={bid ? "brand" : "light-5"} />
            </Box>
            {showDrop && bid && targetRef.current && (
                <Drop
                    align={{ left: "right" }}
                    target={targetRef.current}
                    plain
                    onMouseEnter={() => setShowDrop(true)}
                    onMouseLeave={() => setShowDrop(false)}
                >
                    <Box
                        pad="small"
                        background="white"
                        round="small"
                        elevation="small"
                        border={{ color: "border", size: "xsmall" }}
                        gap="xsmall"
                    >
                        <Text weight="bold">Leading Bid</Text>
                        <Box gap="xxsmall">
                            <Text size="small">
                                <CurrencyFormat
                                    value={bid.annualAmount}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={"$"}
                                />
                            </Text>
                            <Text size="small">Through: {bid.lastSeason.name}</Text>
                            <Text size="small">{bid.team.name ?? ""}</Text>
                        </Box>
                    </Box>
                </Drop>
            )}
        </Box>
    )
}
