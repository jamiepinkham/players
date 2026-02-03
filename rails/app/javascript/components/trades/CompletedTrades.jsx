import React, { useState } from "react";
import Moment from "react-moment";
import { useQuery } from "graphql-hooks";
import { List, Text, Box, Grid, Header, Select, CheckBox, Accordion, AccordionPanel, Button, Pagination, TextInput } from "grommet";
import { History, FormNext, FormPrevious, Search as SearchIcon, FormClose } from "grommet-icons";
import PendingTradeContracts from "./PendingTradeContracts";
import LoadingState from "../LoadingState";
import EmptyState from "../EmptyState";

const TRADES_QUERY = `
query getCompletedTrades($page: Int!, $perPage: Int!, $teamId: ID, $search: String) {
    completedTrades(page: $page, perPage: $perPage, teamId: $teamId, search: $search) {
        trades {
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

            status
            updatedAt
        }
        totalCount
        totalPages
        currentPage
    }
}
`;

const TEAMS_QUERY = `
query getTeams {
    teams {
        id
        name
    }
}
`;

export default function CompletedTrades() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [searchInput, setSearchInput] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const itemsPerPage = 50;

    const { loading: teamsLoading, data: teamsData } = useQuery(TEAMS_QUERY);

    const { loading, error, data, refetch } = useQuery(TRADES_QUERY, {
        variables: {
            page: currentPage,
            perPage: itemsPerPage,
            teamId: selectedTeam?.id,
            search: activeSearch || null
        }
    });

    // Reset to page 1 when filters change
    const handleTeamChange = (team) => {
        setSelectedTeam(team);
        setCurrentPage(1);
    };

    const handleSearchChange = (event) => {
        setSearchInput(event.target.value);
    };

    const executeSearch = () => {
        setActiveSearch(searchInput);
        setCurrentPage(1);
    };

    const handleSearchKeyPress = (event) => {
        if (event.key === 'Enter') {
            executeSearch();
        }
    };

    const clearSearch = () => {
        setSearchInput("");
        setActiveSearch("");
        setCurrentPage(1);
    };

    if (loading || teamsLoading) return <LoadingState message="Loading completed trades..." />;
    if (!data || !data.completedTrades) return <LoadingState message="Loading completed trades..." />;

    const { trades, totalPages } = data.completedTrades;
    const teams = teamsData?.teams || [];

    if (trades.length === 0 && !selectedTeam && !activeSearch) {
        return (
            <EmptyState
                icon={History}
                title="No completed trades"
                message="There are no completed trades to display yet"
            />
        );
    }

    return (
        <Box gap="small">
            <Box direction="row-responsive" gap="small" pad={{ bottom: 'small' }} style={{ minHeight: '60px' }}>
                <Box width={{ min: "150px", max: "200px" }}>
                    <Select
                        placeholder="Filter by team"
                        options={[{ id: null, name: "All Teams" }, ...teams]}
                        labelKey="name"
                        valueKey={{ key: "id", reduce: true }}
                        value={selectedTeam?.id || null}
                        onChange={({ option }) => handleTeamChange(option.id ? option : null)}
                    />
                </Box>
                <Box flex direction="row" align="center" gap="xsmall">
                    <Box flex style={{ position: 'relative' }}>
                        <TextInput
                            placeholder="Search by player name or team..."
                            value={searchInput}
                            onChange={handleSearchChange}
                            onKeyPress={handleSearchKeyPress}
                        />
                        {searchInput && (
                            <Button
                                icon={<FormClose />}
                                onClick={clearSearch}
                                plain
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            />
                        )}
                    </Box>
                    <Button
                        icon={<SearchIcon color="white" />}
                        onClick={executeSearch}
                        primary
                        label="Search"
                    />
                </Box>
            </Box>

            <Box direction="row" justify="between" align="center" pad={{ vertical: 'small', bottom: 'small' }} style={{ minHeight: '48px' }}>
                <Text size="small" color="dark-4">
                    Showing {trades.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                    {Math.min(currentPage * itemsPerPage, data.completedTrades.totalCount)} of {data.completedTrades.totalCount} trades
                </Text>
                {totalPages > 1 ? (
                    <Pagination
                        numberItems={data.completedTrades.totalCount}
                        page={currentPage}
                        step={itemsPerPage}
                        onChange={({ page }) => setCurrentPage(page)}
                    />
                ) : <Box />}
            </Box>

            {trades.length === 0 ? (
                <Box pad="large" align="center">
                    <EmptyState
                        icon={History}
                        title="No trades found"
                        message="No trades match your current filters"
                    />
                </Box>
            ) : (
                <Accordion multiple>
                {trades.map((trade, index) => (
                    <AccordionPanel
                        key={index}
                        label={
                            <Box direction="row" justify="between" align="center" pad="small" width="100%">
                                <Text weight="bold" size="medium">
                                    {trade.fromTeam.name} ⇄ {trade.toTeam.name}
                                </Text>
                                <Text size="small" color="text-weak" margin={{ left: "medium" }}>
                                    <Moment format="MMM Do YYYY">{trade.updatedAt}</Moment>
                                </Text>
                            </Box>
                        }
                    >
                        <Box pad="medium" background="light-1">
                            <Box direction="row-responsive" gap='medium'>
                                <Box flex>
                                    <Text weight="bold" margin={{ bottom: "small" }}>{trade.fromTeam.name} receives:</Text>
                                    <PendingTradeContracts contracts={trade.toContracts} cash={trade.fromCashAmount} />
                                </Box>
                                <Box flex>
                                    <Text weight="bold" margin={{ bottom: "small" }}>{trade.toTeam.name} receives:</Text>
                                    <PendingTradeContracts contracts={trade.fromContracts} cash={trade.toCashAmount} />
                                </Box>
                            </Box>
                        </Box>
                    </AccordionPanel>
                ))}
            </Accordion>
            )}
        </Box>
    );
}
