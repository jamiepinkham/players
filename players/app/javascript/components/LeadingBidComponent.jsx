import React from 'react';

import { 
    Box, 
    Text
} from 'grommet';

import CurrencyFormat from 'react-currency-format';

export default function LeadingBidComponent({player}) {
    const bid = player.bids ? player.bids[0] : null
    return (
        <Box>
        { (bid != null) ? 
            (<Box>
                <CurrencyFormat
                   value={bid.annualAmount}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                />
                <Text>{bid.lastSeason.name}</Text>
                <Text>{bid.team.name ?? ""}</Text>
            </Box>
        ) : (
            <Text>No leading bids</Text>
        )}    
        </Box>    
    )
}
