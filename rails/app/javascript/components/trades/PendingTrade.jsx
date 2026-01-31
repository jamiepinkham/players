import React, { useState } from 'react';
import { Grid, Box, Text, Button, Spinner } from "grommet";
import PendingTradeContracts from './PendingTradeContracts';


function PendingTrade({ trade, myTeamId, onAcceptTrade, onRejectTrade }) {
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    let fromContracts, fromCashAmount, fromTeamName, toContracts, toCashAmount, toTeamName;

    if (myTeamId === trade.fromTeam.id) {
        fromContracts = <PendingTradeContracts contracts={trade.fromContracts} cash={trade.fromCashAmount} />;
        fromTeamName = trade.fromTeam.name;
        toContracts = <PendingTradeContracts contracts={trade.toContracts} cash={trade.toCashAmount} />;
        toTeamName = trade.toTeam.name;
    } else {
        fromContracts = <PendingTradeContracts contracts={trade.toContracts} cash={trade.toCashAmount} />;
        fromTeamName = trade.toTeam.name;
        toContracts = <PendingTradeContracts contracts={trade.fromContracts} cash={trade.fromCashAmount} />;
        toTeamName = trade.fromTeam.name;
    }

    async function acceptTrade() {
        setIsAccepting(true);
        try {
            await onAcceptTrade(trade.id);
        } finally {
            setIsAccepting(false);
        }
    }

    async function rejectTrade() {
        setIsRejecting(true);
        try {
            await onRejectTrade(trade.id);
        } finally {
            setIsRejecting(false);
        }
    }

    return (
        <Grid
            rows={['xsmall', 'xxxsmall']}
            columns={['1/2', '1/2']}
            gap='small'
            align='center'
            areas={[
                { name: 'footer', start: [1, 1], end: [1, 1] },
                { name: 'from', start: [0, 0], end: [0, 0] },
                { name: 'to', start: [1, 0], end: [1, 0] },
            ]}>
            <Box gridArea='from'>
                <Text>{fromTeamName} send</Text>
                {fromContracts}
            </Box>
            <Box gridArea='to'>
                <Text>{toTeamName} send</Text>
                {toContracts}
            </Box>
            <Box gridArea='footer' gap='small' alignSelf='end'>
                {trade.toTeam.id == myTeamId &&
                    <Button
                        pad="small"
                        align='end'
                        primary
                        onClick={acceptTrade}
                        label={isAccepting ? "Accepting..." : "Accept"}
                        icon={isAccepting ? <Spinner size="xsmall" /> : undefined}
                        disabled={isAccepting || isRejecting}
                    />
                }
                <Button
                    pad="small"
                    align='end'
                    secondary
                    onClick={rejectTrade}
                    label={isRejecting ? "Rejecting..." : "Reject"}
                    icon={isRejecting ? <Spinner size="xsmall" /> : undefined}
                    disabled={isAccepting || isRejecting}
                />
            </Box>
        </Grid>
    );
}

export default PendingTrade;