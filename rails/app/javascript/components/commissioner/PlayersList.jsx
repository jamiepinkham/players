import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Button,
  Spinner,
  DataTable,
  TextInput,
  CheckBox,
  Select,
} from "grommet";
import { Previous, Search } from "grommet-icons";

const PlayersList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [updatingPlayers, setUpdatingPlayers] = useState(new Set());
  const [counts, setCounts] = useState({});

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [players, searchQuery, statusFilter]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/commissioner/free_agents");
      setPlayers(response.data.players);
      setCounts(response.data.counts);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = players;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.bbrefid?.toLowerCase().includes(query) ||
          p.positions?.some((pos) => pos.toLowerCase().includes(query))
      );
    }

    setFilteredPlayers(filtered);
  };

  const toggleFreeAgent = async (playerId, currentValue) => {
    setUpdatingPlayers(prev => new Set(prev).add(playerId));
    try {
      await axios.patch(`/api/commissioner/free_agents/${playerId}`, {
        is_free_agent: !currentValue
      });
      // Refresh the list
      await fetchPlayers();
    } catch (err) {
      setError(err.message || "Failed to update player");
    } finally {
      setUpdatingPlayers(prev => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "free_agent":
        return { text: "✅ Free Agent", color: "status-ok" };
      case "under_contract":
        return { text: "⛔ Under Contract", color: "status-error" };
      case "ineligible":
        return { text: "⚠️ Ineligible", color: "status-warning" };
      case "expiring":
        return { text: "⏳ Expiring Contract", color: "status-critical" };
      default:
        return { text: status, color: "text" };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "free_agent":
        return "✅";
      case "under_contract":
        return "⛔";
      case "ineligible":
        return "⚠️";
      case "expiring":
        return "⏳";
      default:
        return "";
    }
  };

  const columns = [
    {
      property: "name",
      header: <Text weight="bold">Player</Text>,
      primary: true,
      size: "medium",
      render: (player) => (
        <Box>
          <Text weight="bold">{player.name}</Text>
          {player.positions && player.positions.length > 0 && (
            <Text size="small" color="dark-6">
              {player.positions.join(", ")}
            </Text>
          )}
        </Box>
      ),
    },
    {
      property: "status",
      header: <Text weight="bold">Status</Text>,
      size: "xsmall",
      align: "center",
      render: (player) => (
        <Text size="large">{getStatusIcon(player.status)}</Text>
      ),
    },
    {
      property: "reasons",
      header: <Text weight="bold">Why</Text>,
      size: "large",
      render: (player) => (
        <Box gap="xxsmall">
          {player.reasons.map((reason, idx) => (
            <Text key={idx} size="small">
              • {reason}
            </Text>
          ))}
        </Box>
      ),
    },
    {
      property: "is_free_agent",
      header: <Text weight="bold">Free Agent</Text>,
      size: "xsmall",
      align: "center",
      render: (player) => {
        if (player.status === 'under_contract' || player.status === 'expiring') {
          return <Text color="dark-6">—</Text>;
        }
        return (
          <CheckBox
            checked={player.is_free_agent}
            onChange={() => toggleFreeAgent(player.id, player.is_free_agent)}
            disabled={updatingPlayers.has(player.id)}
          />
        );
      },
    },
  ];

  if (loading) {
    return (
      <Box fill align="center" justify="center" pad="large">
        <Spinner size="large" />
        <Text margin={{ top: "medium" }}>Loading players...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box fill align="center" justify="center" pad="large">
        <Text color="status-error" size="large">
          {error}
        </Text>
        <Button
          label="Retry"
          onClick={fetchPlayers}
          margin={{ top: "medium" }}
        />
      </Box>
    );
  }

  const statusOptions = [
    { label: `All Players (${players.length})`, value: "all" },
    { label: `⛔ Under Contract (${counts.under_contract || 0})`, value: "under_contract" },
    { label: `✅ Free Agents (${counts.free_agents || 0})`, value: "free_agent" },
    { label: `⚠️ Ineligible (${counts.ineligible || 0})`, value: "ineligible" },
    { label: `⏳ Expiring Contracts (${counts.expiring || 0})`, value: "expiring" },
  ];

  return (
    <Box fill pad="medium" overflow="auto">
      {/* Header with filters */}
      <Box
        direction="row"
        align="center"
        margin={{ bottom: "medium" }}
        gap="small"
      >
        <Button
          icon={<Previous />}
          onClick={() => navigate("/commissioner")}
          tip="Back to dashboard"
          plain
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={({ option }) => setStatusFilter(option.value)}
          labelKey="label"
          valueKey={{ key: "value", reduce: true }}
          style={{ minWidth: "250px" }}
        />
        <TextInput
          icon={<Search />}
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ minWidth: "300px" }}
        />
        <Text size="small" color="dark-6">
          {filteredPlayers.length} of {players.length}
        </Text>
      </Box>

      {/* Table */}
      <Box background="white" round="small" overflow="auto">
        <DataTable
          columns={columns}
          data={filteredPlayers}
          step={50}
          paginate
        />
      </Box>
    </Box>
  );
};

export default PlayersList;
