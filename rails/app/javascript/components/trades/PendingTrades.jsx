import React, { useState } from "react";
import { useQuery, useMutation } from "graphql-hooks";
import { List, Text, Box, Layer, Button } from "grommet";
import { Sync } from "grommet-icons";
import { useAuth } from "../../hooks/use_auth";
import PendingTrade from "./PendingTrade";
import LoadingState from "../LoadingState";
import EmptyState from "../EmptyState";

const TRADES_QUERY = `
    query getMyPendingTrades($teamId: ID!) {
        trades(team: $teamId) {
            id
            fromTeam {
                id
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
                id
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
        }
    }
`;

const ACCEPT_TRADE_MUTATION = `
    mutation acceptTrade($input: AcceptTradeMutationInput!) {
        acceptTrade(input: $input) {
            trade {
                id
            }
        }
    }
`;
const REJECT_TRADE_MUTATION = `
    mutation rejectTrade($input: RejectTradeMutationInput!) {
        rejectTrade(input: $input) {
            trade {
                id
            }
        }
    }
`;

export default function PendingTrades() {
    const teamId = useAuth().teamId;

    const { loading, error, data, refetch, cacheHit } = useQuery(TRADES_QUERY, { variables: { teamId } });
    const [acceptTradeMutation] = useMutation(ACCEPT_TRADE_MUTATION);
    const [rejectTradeMutation] = useMutation(REJECT_TRADE_MUTATION);

    const [notification, setNotification] = useState(null);

    if (!data || !data.trades) return <LoadingState message="Loading pending trades..." />;
    if (data.trades.length == 0) return (
        <EmptyState
            icon={Sync}
            title="No pending trades"
            message="You don't have any trade proposals awaiting action"
        />
    )
    async function onAcceptTrade(tradeId) {
        try {
            const payload = {
                "id": tradeId,
            };
            const result = await acceptTradeMutation({ variables: { "input": payload } });

            if (result.error) {
                throw new Error(result.error.graphQLErrors?.[0]?.message || result.error.message);
            }

            refetch();
        } catch (error) {
            console.error('Accept trade error:', error);
            setNotification({ message: `Error accepting trade: ${error.message}`, type: 'error' });
        }
    }

    async function onRejectTrade(tradeId) {
        try {
            const payload = {
                "id": tradeId,
            };
            const result = await rejectTradeMutation({ variables: { "input": payload } });

            if (result.error) {
                throw new Error(result.error.graphQLErrors?.[0]?.message || result.error.message);
            }

            refetch();
        } catch (error) {
            console.error('Reject trade error:', error);
            setNotification({ message: `Error rejecting trade: ${error.message}`, type: 'error' });
        }
    }
    return (
        <>
            <List gap="small" alignSelf="stretch" children={(item, index) => {
                return (
                    <PendingTrade trade={item} myTeamId={teamId} key={item.id} onAcceptTrade={onAcceptTrade} onRejectTrade={onRejectTrade} />
                )
            }} data={data.trades} />

            {notification && (
                <Layer
                    position="top"
                    modal={false}
                    margin={{ vertical: "medium", horizontal: "small" }}
                    responsive={false}
                    plain
                >
                    <Box
                        background={notification.type === 'error' ? 'status-error' : 'status-ok'}
                        pad="medium"
                        gap="small"
                        round="small"
                        elevation="medium"
                    >
                        <Text color="white">{notification.message}</Text>
                        <Button
                            label="Dismiss"
                            onClick={() => setNotification(null)}
                            size="small"
                            secondary
                        />
                    </Box>
                </Layer>
            )}
        </>
    );
}

