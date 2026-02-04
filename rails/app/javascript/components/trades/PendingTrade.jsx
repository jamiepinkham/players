import React, { useState } from 'react';
import { Box, Text, Button, Spinner } from "grommet";
import { FormUp, FormDown, Currency } from "grommet-icons";
import PendingTradeContracts from './PendingTradeContracts';


function PendingTrade({ trade, myTeamId, onAcceptTrade, onRejectTrade }) {
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
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
        <Box
            round="small"
            overflow="hidden"
            border={{ color: "border", size: "xsmall" }}
        >
            <Box
                direction="row"
                justify="between"
                align="center"
                pad="medium"
                background="light-1"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ cursor: 'pointer' }}
                hoverIndicator
            >
                <Box direction="row" gap="medium" align="center">
                    <Text weight="bold">{fromTeamName}</Text>
                    <Text color="text-weak">↔</Text>
                    <Text weight="bold">{toTeamName}</Text>
                </Box>
                <Box direction="row" gap="small" align="center">
                    <Text size="small" color="text-weak">
                        {trade.fromContracts.length + trade.toContracts.length} players
                    </Text>
                    {(trade.fromCashAmount > 0 || trade.toCashAmount > 0) && (
                        <Currency size="small" color="status-ok" />
                    )}
                    {isExpanded ? <FormUp /> : <FormDown />}
                </Box>
            </Box>
            {isExpanded && (
                <Box pad="small" background="light-1" gap="small">
                    <Box direction="row" gap="small">
                        <Box flex>
                            <Box pad={{ bottom: "xsmall" }}>
                                <Text weight="bold">{fromTeamName} sends</Text>
                            </Box>
                            {fromContracts}
                        </Box>
                        <Box flex>
                            <Box pad={{ bottom: "xsmall" }}>
                                <Text weight="bold">{toTeamName} sends</Text>
                            </Box>
                            {toContracts}
                        </Box>
                    </Box>
                    <Box direction="row" gap="small" justify="end" pad={{ top: "small" }}>
                        {trade.toTeam.id == myTeamId &&
                            <Button
                                primary
                                size="large"
                                onClick={acceptTrade}
                                label={isAccepting ? "Accepting..." : "Accept"}
                                icon={isAccepting ? <Spinner size="xsmall" /> : undefined}
                                disabled={isAccepting || isRejecting}
                            />
                        }
                        <Button
                            size="large"
                            onClick={rejectTrade}
                            label={isRejecting ? "Rejecting..." : "Reject"}
                            icon={isRejecting ? <Spinner size="xsmall" /> : undefined}
                            disabled={isAccepting || isRejecting}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default PendingTrade;