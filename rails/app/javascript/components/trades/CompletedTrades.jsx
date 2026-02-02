import React, { useState } from "react";
import Moment from "react-moment";
import { useQuery } from "graphql-hooks";
import { List, Text, Box, Grid, Header, Select, CheckBox, Accordion, AccordionPanel, Button, Pagination, TextInput } from "grommet";
import { History, FormNext, FormPrevious, Search, FormClose } from "grommet-icons";
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

    const clearFilters = () => {
        setSelectedTeam(null);
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
            <Box direction={{ small: "column", medium: "row" }} gap="small" align={{ small: "stretch", medium: "center" }}>
                <Box width="small">
                    <Select
                        placeholder="Filter by team"
                        options={[{ id: null, name: "All Teams" }, ...teams]}
                        labelKey="name"
                        valueKey={{ key: "id", reduce: true }}
                        value={selectedTeam?.id || null}
                        onChange={({ option }) => handleTeamChange(option.id ? option : null)}
                    />
                </Box>
                <Box flex={{ grow: 1, shrink: 1 }}>
                    <TextInput
                        placeholder="Search by player name or team..."
                        value={searchInput}
                        onChange={handleSearchChange}
                        onKeyPress={handleSearchKeyPress}
                    />
                </Box>
                <Button
                    icon={<Search />}
                    onClick={executeSearch}
                    tip="Search"
                />
                {(selectedTeam || activeSearch) && (
                    <Button
                        icon={<FormClose />}
                        onClick={clearFilters}
                        tip="Clear all filters"
                    />
                )}
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
                <Box round="small" overflow="hidden" border={{ color: "border", size: "xsmall" }}>
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
                                <Grid
                                    rows={['auto']}
                                    columns={{ small: ['full'], medium: ['1/2', '1/2'] }}
                                    gap='medium'
                                    align='top'
                                >
                                    <Box>
                                        <Text weight="bold" margin={{ bottom: "small" }}>{trade.fromTeam.name} receives:</Text>
                                        <PendingTradeContracts contracts={trade.toContracts} cash={trade.fromCashAmount} />
                                    </Box>
                                    <Box>
                                        <Text weight="bold" margin={{ bottom: "small" }}>{trade.toTeam.name} receives:</Text>
                                        <PendingTradeContracts contracts={trade.fromContracts} cash={trade.toCashAmount} />
                                    </Box>
                                </Grid>
                            </Box>
                        </AccordionPanel>
                    ))}
                </Accordion>
                </Box>
            )}
            {trades.length > 0 && totalPages > 1 && (
                <Box direction="row" justify="center" align="center" gap="small">
                    <Button
                        icon={<FormPrevious />}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    />
                    <Text>
                        Page {currentPage} of {totalPages}
                    </Text>
                    <Button
                        icon={<FormNext />}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    />
                </Box>
            )}
        </Box>
    );
}
