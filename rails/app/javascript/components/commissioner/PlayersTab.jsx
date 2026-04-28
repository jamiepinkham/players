import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Spinner,
  TextInput,
  DataTable,
  Select,
} from "grommet";
import { Search } from "grommet-icons";

const PlayersTab = ({ freeAgents, season, setNotification }) => {
  const navigate = useNavigate();
  const [freeAgentsList, setFreeAgentsList] = useState([]);
  const [loadingFreeAgents, setLoadingFreeAgents] = useState(false);
  const [faSearchQuery, setFaSearchQuery] = useState('');
  const [faStatusFilter, setFaStatusFilter] = useState('all');

  useEffect(() => {
    fetchFreeAgentsList();
  }, []);

  const fetchFreeAgentsList = async () => {
    setLoadingFreeAgents(true);
    try {
      const response = await axios.get("/api/commissioner/free_agents");
      setFreeAgentsList(response.data.players);
    } catch (err) {
      setNotification({
        message: 'Failed to load free agents',
        type: 'error'
      });
    } finally {
      setLoadingFreeAgents(false);
    }
  };

  return (
    <>
      <Heading level={2} margin={{ bottom: "medium" }}>👥 Player Management</Heading>

      {/* Current Stats */}
      <Card background="white" margin={{ bottom: "medium" }}>
        <CardBody pad="medium">
          <Box direction="row" gap="medium" justify="around">
            <Box align="center" flex>
              <Text size="xlarge" weight="bold" color="status-ok">{freeAgents?.count || 0}</Text>
              <Text size="small" color="dark-6">✅ Free Agents</Text>
            </Box>
            <Box align="center" flex>
              <Text size="xlarge" weight="bold" color="status-error">{freeAgents?.underContract || 0}</Text>
              <Text size="small" color="dark-6">⛔ Under Contract</Text>
            </Box>
            <Box align="center" flex>
              <Text size="xlarge" weight="bold" color="status-warning">{freeAgents?.ineligible || 0}</Text>
              <Text size="small" color="dark-6">⚠️ Ineligible</Text>
            </Box>
            <Box align="center" flex>
              <Text size="xlarge" weight="bold" color="status-critical">{season?.expiringContracts || 0}</Text>
              <Text size="small" color="dark-6">⏳ Expiring</Text>
            </Box>
          </Box>
        </CardBody>
      </Card>

      {/* Search and Filter */}
      <Box direction="row" justify="between" align="center" margin={{ bottom: "medium" }}>
        <Text weight="bold">All Players</Text>
        <Box direction="row" gap="small" align="center">
          <Select
            options={[
              { label: 'All Players', value: 'all' },
              { label: 'Free Agents', value: 'free_agent' },
              { label: 'Under Contract', value: 'under_contract' },
              { label: 'Ineligible', value: 'ineligible' },
              { label: 'Expiring', value: 'expiring' }
            ]}
            value={faStatusFilter}
            onChange={({ option }) => setFaStatusFilter(option.value)}
            labelKey="label"
            valueKey={{ key: "value", reduce: true }}
          />
          <TextInput
            icon={<Search />}
            placeholder="Search players..."
            value={faSearchQuery}
            onChange={(e) => setFaSearchQuery(e.target.value)}
            style={{ minWidth: '300px' }}
          />
        </Box>
      </Box>

      {loadingFreeAgents ? (
        <Box align="center" pad="large">
          <Spinner size="large" />
        </Box>
      ) : (
        <Card background="white">
          <DataTable
            columns={[
              {
                property: 'name',
                header: <Text weight="bold">Player</Text>,
                primary: true,
                search: true,
                sortable: true,
                render: datum => (
                  <Box>
                    <Text weight="bold">{datum.name}</Text>
                    <Text size="small" color="dark-6">{datum.positions?.join(', ')}</Text>
                  </Box>
                )
              },
              {
                property: 'status',
                header: <Text weight="bold">Status</Text>,
                sortable: true,
                render: datum => (
                  <Box
                    background={
                      datum.status === 'free_agent' ? 'status-ok' :
                      datum.status === 'under_contract' ? 'status-error' :
                      datum.status === 'expiring' ? 'status-critical' :
                      'status-warning'
                    }
                    pad={{ horizontal: 'small', vertical: 'xxsmall' }}
                    round="small"
                    style={{ display: 'inline-block' }}
                  >
                    <Text size="xsmall" weight="bold" color="white">
                      {datum.status === 'free_agent' ? '✅ FA' :
                       datum.status === 'under_contract' ? '⛔ Contract' :
                       datum.status === 'expiring' ? '⏳ Expiring' :
                       '⚠️ Ineligible'}
                    </Text>
                  </Box>
                )
              },
              {
                property: 'reasons',
                header: <Text weight="bold">Details</Text>,
                render: datum => (
                  <Box>
                    {datum.reasons.map((reason, idx) => (
                      <Text key={idx} size="small">• {reason}</Text>
                    ))}
                  </Box>
                )
              },
              {
                property: 'actions',
                header: <Text weight="bold">Actions</Text>,
                render: datum => (
                  <Button
                    label="Edit"
                    size="small"
                    onClick={() => navigate(`/commissioner/players/${datum.id}/edit`)}
                  />
                )
              }
            ]}
            data={freeAgentsList.filter(player => {
              // Filter by status
              if (faStatusFilter !== 'all' && player.status !== faStatusFilter) {
                return false;
              }
              // Filter by search query
              if (faSearchQuery) {
                const query = faSearchQuery.toLowerCase();
                return player.name.toLowerCase().includes(query) ||
                       player.positions?.some(p => p.toLowerCase().includes(query));
              }
              return true;
            })}
            sort={{ property: 'name', direction: 'asc' }}
            paginate
            step={25}
          />
        </Card>
      )}
    </>
  );
};

export default PlayersTab;
