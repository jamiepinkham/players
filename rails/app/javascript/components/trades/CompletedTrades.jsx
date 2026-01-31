import React, { useState } from "react";
import Moment from "react-moment";
import { useQuery } from "graphql-hooks";
import { List, Spinner, Text, Box, Grid, Header, Select, CheckBox } from "grommet";
import PendingTradeContracts from "./PendingTradeContracts";

const TRADES_QUERY = `
query getCompletedTrades { 
    completedTrades { 
        fromTeam {
            name
  	    }
  	    fromContracts {
            id
            player {
                name
                bbrefid
                position
            }
            amount
            lastSeason {
                name
            }
        }
        fromCashAmount

        toTeam {
            name
        }
        toContracts {
            id
            player {
                name
                bbrefid
                position
    	    }
    	    amount
    	    lastSeason {
                name
    	    }
        }
        toCashAmount
    
        status
        updatedAt
    }
}
`;

export default function CompletedTrades() {
    const { loading, error, data, refetch, cacheHit } = useQuery(TRADES_QUERY);

    if (!data || !data.completedTrades) return <Spinner size="medium" alignSelf="center" />;
    if (data.completedTrades.length == 0) return (<Box margin="medium"><Text>No completed trades</Text></Box>);
    
    return (
            <List gap="small" background={['white', 'light-2']} alignSelf="stretch" children={(item, index) => {
                return (
                    <Box>
                        <Grid
                            rows={['xsmall', 'xxxsmall']}
                            columns={['1/2', '1/2']}
                            gap='small'
                            align='top'
                            areas={[
                                { name: 'from', start: [0, 0], end: [0, 0] },
                                { name: 'to', start: [1, 0], end: [1, 0] },
                            ]}>
                            <Box gridArea='from'>
                                <Text weight="bold">{item.fromTeam.name}</Text>
                                <PendingTradeContracts contracts={item.fromContracts} cash={item.toCashAmount} />
                            </Box>
                            <Box gridArea='to'>
                                <Text weight="bold">{item.toTeam.name}</Text>
                                <PendingTradeContracts contracts={item.toContracts} cash={item.fromCashAmount} />
                            </Box>
                    </Grid>
                    <Text weight="bold">
                        Completed: <Moment format="MMM Do YYYY">{item.updatedAt}</Moment>
                    </Text>
                </Box>
                )
            }} data={data.completedTrades} />
    );
}
