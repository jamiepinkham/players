import React from "react";
import { useQuery, useMutation } from "graphql-hooks";
import { List, Spinner, Text, Box } from "grommet";
import { useAuth } from "../../hooks/use_auth";
import PendingTrade from "./PendingTrade";

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

    if (!data || !data.trades) return <Spinner size="medium" alignSelf="center" />;
    if (data.trades.length == 0) return (<Box margin="medium"><Text>No pending trades</Text></Box>)
    async function onAcceptTrade(tradeId) {
        const payload = {
            "id": tradeId,
        };
        await acceptTradeMutation({ variables: { "input": payload } });
        refetch();
    }

    async function onRejectTrade(tradeId) {
        const payload = {
            "id": tradeId,
        };
        await rejectTradeMutation({ variables: { "input": payload } });
        refetch();
    }
    return (
        <List gap="small" alignSelf="stretch" children={(item, index) => {
            return (
                <PendingTrade trade={item} myTeamId={teamId} key={item.id} onAcceptTrade={onAcceptTrade} onRejectTrade={onRejectTrade} />
            )
        }} data={data.trades} />
    );
}

