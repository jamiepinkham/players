import React, { useState, useMemo } from "react";
import {
  Box,
  Text,
  TextInput,
  Select,
  Collapsible,
  DataTable
} from "grommet";
import { useQuery } from "graphql-hooks";

const PLAYERS_QUERY = `
query GetPlayers {
  activePlayers {
    id
    bbrefid
    bbrefMinors
    name
    position
    stats {
      title
      value
    }
    contract {
      firstSeason { name }
      lastSeason { name }
      active
    }
  }
}
`;

function groupStats(stats) {
  const grouped = {};
  stats.forEach(({ title, value }) => {
    grouped[title] = value;
  });
  return grouped;
}

const AllPlayersListSearch = () => {
  const { loading, error, data } = useQuery(PLAYERS_QUERY);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filteredPlayers = useMemo(() => {
    if (!data?.activePlayers) return [];
    return data.activePlayers.filter(player => {
      const nameMatch = player.name.toLowerCase().includes(search.toLowerCase());
      const positionMatch = !positionFilter || player.position === positionFilter;
      return nameMatch && positionMatch;
    });
  }, [data, search, positionFilter]);

  const uniquePositions = useMemo(() => {
    const set = new Set(data?.activePlayers.map(p => p.position));
    return Array.from(set);
  }, [data]);

  if (loading) return <Text>Loading players...</Text>;
  if (error) return <Text color="status-critical">Error: {error.message}</Text>;

  return (
    <Box fill pad="medium" overflow="auto">
      <Box direction="row" gap="small" margin={{ bottom: "small" }}>
        <TextInput
          placeholder="Search by name"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <Select
          placeholder="Filter by position"
          options={uniquePositions}
          value={positionFilter}
          onChange={({ option }) => setPositionFilter(option)}
        />
      </Box>

      {filteredPlayers.map(player => {
        const isExpanded = expandedId === player.id;
        const stats = groupStats(player.stats || []);
        const hasStats = Object.keys(stats).length > 0;
        const isPitcher = player.position === "SP" || player.position === "RP";
        const contractText = player.contract
          ? `${player.contract.firstSeason?.name || "?"} → ${player.contract.lastSeason?.name || "?"}`
          : "Free Agent";

        return (
          <Box key={player.id} border={{ side: "bottom", color: "light-4" }} pad={{ vertical: "small" }}>
            <Box
              direction="row"
              justify="between"
              align="center"
              onClick={() => setExpandedId(isExpanded ? null : player.id)}
              hoverIndicator="light-1"
              pad={{ vertical: "xsmall" }}
              style={{ cursor: "pointer" }}
            >
              <Box direction="row" gap="medium" flex>
                <Text weight="bold">{player.name}</Text>
                <Text>{player.position}</Text>
              </Box>
              <Text>{contractText}</Text>
            </Box>

            <Collapsible open={isExpanded}>
              <Box pad={{ top: "small", left: "small" }} background="light-2">
                {hasStats ? (
                  <DataTable
                    columns={
                      isPitcher
                        ? [
                            { property: "IP", header: "IP" },
                            { property: "ERA", header: "ERA" },
                            { property: "W", header: "W" },
                            { property: "L", header: "L" },
                            { property: "SV", header: "SV" },
                            { property: "G", header: "G" },
                            { property: "GS", header: "GS" },
                            { property: "SO9", header: "K/9" },
                            { property: "BB9", header: "BB/9" },
                            { property: "HR9", header: "HR/9" },
                            { property: "WAR", header: "WAR" },
                          ]
                        : [
                            { property: "PA", header: "PA" },
                            { property: "HR", header: "HR" },
                            { property: "R", header: "R" },
                            { property: "RBI", header: "RBI" },
                            { property: "SB", header: "SB" },
                            { property: "BA", header: "AVG" },
                            { property: "OBP", header: "OBP" },
                            { property: "SLG", header: "SLG" },
                            { property: "OPS", header: "OPS" },
                            { property: "WAR", header: "WAR" },
                          ]
                    }
                    data={[stats]}
                    size="small"
                    border={{ color: "light-4", side: "all" }}
                    background="light-1"
                    pad={{ horizontal: "xsmall", vertical: "xxsmall" }}
                  />
                ) : (
                  <Text italic color="dark-5">No stats available</Text>
                )}
              </Box>
            </Collapsible>
          </Box>
        );
      })}
    </Box>
  );
};

export default AllPlayersListSearch;
