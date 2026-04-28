import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  Spinner,
  Layer,
  TextInput,
  DataTable,
  FormField,
  TextArea,
  Anchor,
} from "grommet";
import { Edit, Trash } from "grommet-icons";

const TeamsTab = ({ setNotification }) => {
  const navigate = useNavigate();
  const [allTeams, setAllTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: '', budget: 0, stadium: '', comment: '' });
  const [savingTeam, setSavingTeam] = useState(false);

  useEffect(() => {
    fetchAllTeams();
  }, []);

  const fetchAllTeams = async () => {
    setLoadingTeams(true);
    try {
      const response = await axios.get('/api/commissioner/teams');
      setAllTeams(response.data.teams);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setNotification({ message: 'Failed to load teams', type: 'error' });
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name || newTeam.budget === null) {
      setNotification({ message: 'Please fill in required fields', type: 'error' });
      return;
    }

    setSavingTeam(true);
    try {
      await axios.post('/api/commissioner/teams', { team: newTeam });
      setNotification({ message: 'Team created successfully!', type: 'success' });
      setShowCreateTeamModal(false);
      setNewTeam({ name: '', budget: 0, stadium: '', comment: '' });
      await fetchAllTeams();
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to create team', type: 'error' });
    } finally {
      setSavingTeam(false);
    }
  };

  const handleUpdateTeam = async () => {
    setSavingTeam(true);
    try {
      await axios.patch(`/api/commissioner/teams/${editingTeam.id}`, { team: editingTeam });
      setNotification({ message: 'Team updated successfully!', type: 'success' });
      setShowEditTeamModal(false);
      setEditingTeam(null);
      await fetchAllTeams();
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to update team', type: 'error' });
    } finally {
      setSavingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/commissioner/teams/${teamId}`);
      setNotification({ message: 'Team deleted successfully!', type: 'success' });
      await fetchAllTeams();
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to delete team', type: 'error' });
    }
  };

  return (
    <Box>
      <Box direction="row" justify="between" align="center" margin={{ bottom: 'medium' }}>
        <Heading level={2} margin="none">Team Management</Heading>
        <Button
          label="Create Team"
          primary
          onClick={() => setShowCreateTeamModal(true)}
        />
      </Box>

      {/* Summary Stats */}
      <Box direction="row" gap="medium" margin={{ bottom: 'medium' }}>
        <Card background="light-2" pad="small">
          <Text size="small" color="dark-4">Total Teams</Text>
          <Text size="xlarge" weight="bold">{allTeams.length}</Text>
        </Card>
        <Card background="light-2" pad="small">
          <Text size="small" color="dark-4">Teams with Owners</Text>
          <Text size="xlarge" weight="bold">
            {allTeams.filter(t => t.owner_username).length}
          </Text>
        </Card>
        <Card background="light-2" pad="small">
          <Text size="small" color="dark-4">Teams Over Budget</Text>
          <Text size="xlarge" weight="bold" color={allTeams.filter(t => (t.available_cash || 0) < 0).length > 0 ? 'status-error' : 'status-ok'}>
            {allTeams.filter(t => (t.available_cash || 0) < 0).length}
          </Text>
        </Card>
      </Box>

      {/* Teams DataTable */}
      {loadingTeams ? (
        <Box align="center" pad="large">
          <Spinner />
          <Text margin={{ top: 'small' }}>Loading teams...</Text>
        </Box>
      ) : (
        <DataTable
          columns={[
            {
              property: 'name',
              header: 'Team Name',
              primary: true,
              sortable: true,
              render: datum => (
                <Anchor
                  onClick={() => navigate(`/team/${datum.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {datum.name}
                </Anchor>
              )
            },
            {
              property: 'owner_username',
              header: 'Owner',
              sortable: true,
              render: datum => datum.owner_username || <Text color="dark-4">Unassigned</Text>
            },
            {
              property: 'budget',
              header: 'Budget',
              sortable: true,
              render: datum => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(datum.budget || 0)
            },
            {
              property: 'current_payroll',
              header: 'Payroll',
              sortable: true,
              render: datum => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(datum.current_payroll || 0)
            },
            {
              property: 'available_cash',
              header: 'Available',
              sortable: true,
              render: datum => {
                const available = datum.available_cash || 0;
                return (
                  <Text color={available < 0 ? 'status-error' : 'status-ok'}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(available)}
                  </Text>
                );
              }
            },
            { property: 'total_players', header: 'Players', sortable: true },
            {
              property: 'actions',
              header: 'Actions',
              render: datum => (
                <Box direction="row" gap="xsmall">
                  <Button
                    icon={<Edit />}
                    onClick={() => {
                      setEditingTeam(datum);
                      setShowEditTeamModal(true);
                    }}
                    size="small"
                  />
                  <Button
                    icon={<Trash />}
                    onClick={() => handleDeleteTeam(datum.id, datum.name)}
                    size="small"
                    color="status-error"
                  />
                </Box>
              )
            }
          ]}
          data={allTeams}
          sort={{ property: 'name', direction: 'asc' }}
        />
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <Layer
          position="center"
          onEsc={() => setShowCreateTeamModal(false)}
          onClickOutside={() => setShowCreateTeamModal(false)}
        >
          <Box pad="medium" gap="small" width="medium">
            <Heading level={3} margin="none">Create Team</Heading>

            <FormField label="Team Name" required>
              <TextInput
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              />
            </FormField>

            <FormField label="Budget" required>
              <Box direction="row" gap="xsmall" align="center">
                <Text>$</Text>
                <TextInput
                  type="text"
                  value={newTeam.budget}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewTeam({ ...newTeam, budget: parseInt(value) || 0 });
                  }}
                />
              </Box>
            </FormField>

            <FormField label="Stadium">
              <TextInput
                value={newTeam.stadium}
                onChange={(e) => setNewTeam({ ...newTeam, stadium: e.target.value })}
              />
            </FormField>

            <FormField label="Comment">
              <TextArea
                value={newTeam.comment}
                onChange={(e) => setNewTeam({ ...newTeam, comment: e.target.value })}
              />
            </FormField>

            <Box direction="row" gap="small" justify="end" margin={{ top: 'small' }}>
              <Button label="Cancel" onClick={() => setShowCreateTeamModal(false)} />
              <Button
                label={savingTeam ? 'Creating...' : 'Create Team'}
                primary
                onClick={handleCreateTeam}
                disabled={savingTeam || !newTeam.name}
              />
            </Box>
          </Box>
        </Layer>
      )}

      {/* Edit Team Modal */}
      {showEditTeamModal && editingTeam && (
        <Layer
          position="center"
          onEsc={() => setShowEditTeamModal(false)}
          onClickOutside={() => setShowEditTeamModal(false)}
        >
          <Box pad="medium" gap="small" width="medium">
            <Heading level={3} margin="none">Edit Team: {editingTeam.name}</Heading>

            <FormField label="Team Name" required>
              <TextInput
                value={editingTeam.name}
                onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
              />
            </FormField>

            <FormField label="Budget" required>
              <Box direction="row" gap="xsmall" align="center">
                <Text>$</Text>
                <TextInput
                  type="text"
                  value={editingTeam.budget || 0}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setEditingTeam({ ...editingTeam, budget: parseInt(value) || 0 });
                  }}
                />
              </Box>
            </FormField>

            <FormField label="Stadium">
              <TextInput
                value={editingTeam.stadium || ''}
                onChange={(e) => setEditingTeam({ ...editingTeam, stadium: e.target.value })}
              />
            </FormField>

            <FormField label="Comment">
              <TextArea
                value={editingTeam.comment || ''}
                onChange={(e) => setEditingTeam({ ...editingTeam, comment: e.target.value })}
              />
            </FormField>

            <Box direction="row" gap="small" justify="end" margin={{ top: 'small' }}>
              <Button label="Cancel" onClick={() => setShowEditTeamModal(false)} />
              <Button
                label={savingTeam ? 'Updating...' : 'Update Team'}
                primary
                onClick={handleUpdateTeam}
                disabled={savingTeam}
              />
            </Box>
          </Box>
        </Layer>
      )}
    </Box>
  );
};

export default TeamsTab;
