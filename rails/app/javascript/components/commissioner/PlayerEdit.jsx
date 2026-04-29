import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  TextInput,
  CheckBox,
  FormField,
  Layer,
  Select,
} from "grommet";
import { Previous, Save, Trash, Add } from "grommet-icons";

const POSITIONS = ['SP', 'RP', 'C', '1B', '2B', '3B', 'SS', 'OF', 'DH'];

const PlayerEdit = () => {
  const navigate = useNavigate();
  const { playerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [player, setPlayer] = useState(null);
  const [originalPlayer, setOriginalPlayer] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [editingAmountIndex, setEditingAmountIndex] = useState(null);
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [newContract, setNewContract] = useState({
    team_id: null,
    first_season_id: null,
    last_season_id: null,
    amount: 0,
    active: false,
    summer: false,
    franchise: false
  });
  const [savingContract, setSavingContract] = useState(false);

  useEffect(() => {
    fetchPlayer();
    fetchTeams();
    fetchSeasons();
  }, [playerId]);

  const fetchPlayer = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/commissioner/players/${playerId}`);
      setPlayer(response.data);
      setOriginalPlayer(JSON.parse(JSON.stringify(response.data))); // Deep copy
      setError(null);
    } catch (err) {
      console.error("Failed to fetch player:", err);
      setError(err.message || "Failed to load player");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/commissioner/teams');
      setTeams(response.data.teams);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response = await axios.get('/api/commissioner/seasons');
      setSeasons(response.data.seasons);
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
    }
  };

  const hasUnsavedChanges = () => {
    if (!player || !originalPlayer) return false;
    return JSON.stringify(player) !== JSON.stringify(originalPlayer);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.patch(`/api/commissioner/players/${playerId}`, player);
      setNotification({
        message: "Player updated successfully!",
        type: "success",
      });
      setTimeout(() => navigate("/commissioner"), 2000);
    } catch (err) {
      console.error("Save error:", err);
      setNotification({
        message: err.response?.data?.error || "Failed to update player",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePosition = (position) => {
    const currentPositions = player.positions || [];
    const newPositions = currentPositions.includes(position)
      ? currentPositions.filter(p => p !== position)
      : [...currentPositions, position];
    setPlayer({ ...player, positions: newPositions });
  };

  const updateContract = (index, field, value) => {
    const updatedContracts = [...player.contracts];

    // If setting a contract to active, deactivate all others
    if (field === 'active' && value === true) {
      updatedContracts.forEach((contract, i) => {
        if (i !== index) {
          contract.active = false;
        }
      });
    }

    updatedContracts[index] = {
      ...updatedContracts[index],
      [field]: value,
    };
    setPlayer({ ...player, contracts: updatedContracts });
  };

  const handleAddContract = async () => {
    // Validation
    if (!newContract.team_id || !newContract.first_season_id || !newContract.last_season_id) {
      setNotification({
        message: 'Please fill in all required fields',
        type: 'error'
      });
      return;
    }

    if (newContract.active && hasActiveContract()) {
      setNotification({
        message: 'Cannot set as active - player already has an active contract',
        type: 'error'
      });
      return;
    }

    setSavingContract(true);
    try {
      // Build the update payload
      const updatedContracts = [...player.contracts, {
        team_id: newContract.team_id,
        first_season_id: newContract.first_season_id,
        last_season_id: newContract.last_season_id,
        amount: newContract.amount,
        active: newContract.active,
        summer: newContract.summer,
        franchise: newContract.franchise
      }];

      // Save via existing player update endpoint
      const response = await axios.patch(`/api/commissioner/players/${playerId}`, {
        ...player,
        contracts: updatedContracts
      });

      setNotification({
        message: 'Contract added successfully!',
        type: 'success'
      });

      // Close modal and reset form
      setShowAddContractModal(false);
      setNewContract({
        team_id: null,
        first_season_id: null,
        last_season_id: null,
        amount: 0,
        active: false,
        summer: false,
        franchise: false
      });

      // Refresh player data
      await fetchPlayer();
    } catch (err) {
      console.error('Failed to add contract:', err);
      setNotification({
        message: err.response?.data?.error || 'Failed to add contract',
        type: 'error'
      });
    } finally {
      setSavingContract(false);
    }
  };

  const hasActiveContract = () => {
    return player.contracts?.some(contract => contract.active) || false;
  };

  const deleteContract = (index) => {
    const contract = player.contracts[index];
    if (confirm(`Delete contract with ${contract.team_name}?`)) {
      const updatedContracts = player.contracts.filter((_, i) => i !== index);
      setPlayer({ ...player, contracts: updatedContracts });
    }
  };

  if (loading) {
    return (
      <Box fill align="center" justify="center" pad="large">
        <Spinner size="large" />
        <Text margin={{ top: "medium" }}>Loading player...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box fill align="center" justify="center" pad="large">
        <Text color="status-error" size="large">{error}</Text>
        <Button
          label="Go Back"
          onClick={() => navigate("/commissioner")}
          margin={{ top: "medium" }}
        />
      </Box>
    );
  }

  if (!player) {
    return (
      <Box fill align="center" justify="center" pad="large">
        <Text color="status-error" size="large">Player not found</Text>
        <Button
          label="Go Back"
          onClick={() => navigate("/commissioner")}
          margin={{ top: "medium" }}
        />
      </Box>
    );
  }

  return (
    <Box pad="medium" overflow="auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <Box direction="row" justify="between" align="center" margin={{ bottom: "medium" }}>
        <Box direction="row" gap="small" align="center">
          <Button
            icon={<Previous />}
            onClick={() => navigate("/commissioner")}
            plain
          />
          <Heading level={2} margin="none">
            Edit Player: {player.name}
          </Heading>
        </Box>
        <Button
          label={saving ? "Saving..." : hasUnsavedChanges() ? "Save Changes" : "No Changes"}
          icon={<Save />}
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges()}
          primary={hasUnsavedChanges()}
          color={hasUnsavedChanges() ? "status-critical" : undefined}
        />
      </Box>

      {/* Player Details - Compact */}
      <Card background="white" margin={{ bottom: "medium" }}>
        <CardHeader pad="small" background="brand">
          <Heading level={4} margin="none" color="white">
            Player Details
          </Heading>
        </CardHeader>
        <CardBody pad="small">
          <Box direction="row" gap="medium" wrap>
            <Box flex={{ grow: 1, shrink: 1 }} basis="45%">
              <FormField label="Player Name" margin="none">
                <TextInput
                  name="name"
                  value={player.name || ""}
                  onChange={(e) => setPlayer({ ...player, name: e.target.value })}
                />
              </FormField>
            </Box>

            <Box flex={{ grow: 1, shrink: 1 }} basis="45%">
              <FormField label="Baseball Reference ID" help="Critical - drives stats lookup" margin="none">
                <TextInput
                  name="bbrefid"
                  value={player.bbrefid || ""}
                  onChange={(e) => setPlayer({ ...player, bbrefid: e.target.value })}
                />
              </FormField>
            </Box>

            <Box flex={{ grow: 1, shrink: 1 }} basis="45%">
              <FormField label="Positions" margin="none">
                <Box direction="row" wrap gap="xsmall" pad="small" border round="xsmall">
                  {POSITIONS.map(position => (
                    <CheckBox
                      key={position}
                      checked={player.positions?.includes(position) || false}
                      label={position}
                      onChange={() => togglePosition(position)}
                    />
                  ))}
                </Box>
              </FormField>
            </Box>

            <Box flex={{ grow: 1, shrink: 1 }} basis="45%" justify="center">
              <CheckBox
                checked={player.is_free_agent || false}
                label="Is Free Agent"
                onChange={(e) => setPlayer({ ...player, is_free_agent: e.target.checked })}
                disabled={hasActiveContract()}
              />
              {hasActiveContract() && (
                <Text size="xsmall" color="status-error" margin={{ left: "small" }}>
                  Cannot be free agent with active contract
                </Text>
              )}
            </Box>
          </Box>
        </CardBody>
      </Card>

      {/* Contracts */}
      <Card background="white">
        <CardHeader pad="small" background="brand">
          <Heading level={4} margin="none" color="white">
            Contracts ({player.contracts?.length || 0})
          </Heading>
        </CardHeader>
        <CardBody pad="small">
          <Box margin={{ bottom: "small" }}>
            <Button
              icon={<Add />}
              label="Add Contract"
              onClick={() => setShowAddContractModal(true)}
              size="small"
              alignSelf="start"
              disabled={hasActiveContract()}
              tip={hasActiveContract() ? "Cannot add contract - player already has an active contract" : undefined}
            />
          </Box>

          {player.contracts && player.contracts.length > 0 ? (
            <Box gap="small">
              {player.contracts.map((contract, index) => (
                <Card key={contract.id || index} background="light-1">
                  <CardBody pad="small">
                    {/* Contract Header */}
                    <Box direction="row" justify="between" align="center" margin={{ bottom: "small" }}>
                      <Box direction="row" gap="small" align="center">
                        <Text weight="bold">{contract.team_name}</Text>
                        <Text size="small" color="dark-6">
                          {contract.first_season} - {contract.last_season}
                        </Text>
                        {contract.active && (
                          <Box
                            background="status-ok"
                            pad={{ horizontal: "xsmall", vertical: "xxsmall" }}
                            round="xsmall"
                          >
                            <Text size="xsmall" weight="bold" color="white">
                              ACTIVE
                            </Text>
                          </Box>
                        )}
                      </Box>
                      <Box direction="row" gap="xsmall" align="center" style={{ minWidth: '150px', justifyContent: 'flex-end' }}>
                        {contract.active && editingAmountIndex === index ? (
                          <Box direction="row" gap="xsmall" align="center">
                            <Text size="small" weight="bold">$</Text>
                            <TextInput
                              type="text"
                              value={Math.floor(contract.amount || 0)}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                updateContract(index, 'amount', parseInt(value) || 0);
                              }}
                              onBlur={() => setEditingAmountIndex(null)}
                              autoFocus
                              style={{ width: '140px', textAlign: 'right', fontWeight: 'bold' }}
                            />
                          </Box>
                        ) : (
                          <Text
                            weight="bold"
                            onClick={() => contract.active && setEditingAmountIndex(index)}
                            style={{
                              cursor: contract.active ? 'pointer' : 'default',
                              textDecoration: contract.active ? 'underline' : 'none',
                              textDecorationStyle: contract.active ? 'dotted' : 'none',
                              textAlign: 'right'
                            }}
                          >
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }).format(contract.amount || 0)}
                          </Text>
                        )}
                      </Box>
                    </Box>

                    {/* Contract Flags and Actions */}
                    <Box direction="row" gap="medium" align="center" justify="between" margin={{ top: "small" }}>
                      <Box direction="row" gap="medium">
                        <CheckBox
                          checked={contract.active || false}
                          label="Active"
                          onChange={(e) => updateContract(index, 'active', e.target.checked)}
                        />
                        <CheckBox
                          checked={contract.summer || false}
                          label="Summer"
                          onChange={(e) => updateContract(index, 'summer', e.target.checked)}
                        />
                        <CheckBox
                          checked={contract.franchise || false}
                          label="Franchise"
                          onChange={(e) => updateContract(index, 'franchise', e.target.checked)}
                        />
                      </Box>
                      <Button
                        icon={<Trash />}
                        label="Delete"
                        color="status-error"
                        size="small"
                        onClick={() => deleteContract(index)}
                      />
                    </Box>
                  </CardBody>
                </Card>
              ))}
            </Box>
          ) : (
            <Box align="center" pad="medium">
              <Text color="dark-6">No contracts</Text>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Add Contract Modal */}
      {showAddContractModal && (
        <Layer
          position="center"
          onEsc={() => setShowAddContractModal(false)}
          onClickOutside={() => setShowAddContractModal(false)}
        >
          <Box pad="medium" gap="small" width="large">
            <Heading level={3} margin="none">Add New Contract</Heading>

            <FormField label="Team" required>
              <Select
                options={teams}
                value={newContract.team_id}
                onChange={({ option }) => setNewContract({ ...newContract, team_id: option.id })}
                labelKey="name"
                valueKey={{ key: "id", reduce: true }}
                placeholder="Select team..."
              />
            </FormField>

            <Box direction="row" gap="small">
              <FormField label="First Season" required flex>
                <Select
                  options={seasons}
                  value={newContract.first_season_id}
                  onChange={({ option }) => setNewContract({ ...newContract, first_season_id: option.id })}
                  labelKey="name"
                  valueKey={{ key: "id", reduce: true }}
                  placeholder="Select season..."
                />
              </FormField>

              <FormField label="Last Season" required flex>
                <Select
                  options={seasons}
                  value={newContract.last_season_id}
                  onChange={({ option }) => setNewContract({ ...newContract, last_season_id: option.id })}
                  labelKey="name"
                  valueKey={{ key: "id", reduce: true }}
                  placeholder="Select season..."
                />
              </FormField>
            </Box>

            <FormField label="Annual Amount" required>
              <Box direction="row" gap="xsmall" align="center">
                <Text>$</Text>
                <TextInput
                  type="text"
                  value={newContract.amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewContract({ ...newContract, amount: parseInt(value) || 0 });
                  }}
                  placeholder="0"
                />
              </Box>
            </FormField>

            <Box direction="row" gap="medium">
              <CheckBox
                checked={newContract.active}
                label="Active Contract"
                onChange={(e) => setNewContract({ ...newContract, active: e.target.checked })}
                disabled={hasActiveContract()}
              />
              <CheckBox
                checked={newContract.summer}
                label="Summer Contract"
                onChange={(e) => setNewContract({ ...newContract, summer: e.target.checked })}
              />
              <CheckBox
                checked={newContract.franchise}
                label="Franchise Tag"
                onChange={(e) => setNewContract({ ...newContract, franchise: e.target.checked })}
              />
            </Box>

            {hasActiveContract() && (
              <Text size="small" color="status-error">
                Cannot set as active - player already has an active contract
              </Text>
            )}

            <Box direction="row" gap="small" justify="end" margin={{ top: "small" }}>
              <Button
                label="Cancel"
                onClick={() => {
                  setShowAddContractModal(false);
                  setNewContract({
                    team_id: null,
                    first_season_id: null,
                    last_season_id: null,
                    amount: 0,
                    active: false,
                    summer: false,
                    franchise: false
                  });
                }}
              />
              <Button
                label={savingContract ? "Adding..." : "Add Contract"}
                primary
                onClick={handleAddContract}
                disabled={savingContract || !newContract.team_id || !newContract.first_season_id || !newContract.last_season_id}
              />
            </Box>
          </Box>
        </Layer>
      )}

      {/* Notification */}
      {notification && (
        <Layer
          position="top"
          modal={false}
          onClickOutside={() => setNotification(null)}
          responsive={false}
          plain
        >
          <Box
            pad="medium"
            gap="small"
            width="medium"
            background={notification.type === "error" ? "status-error" : "status-ok"}
            round="small"
            elevation="medium"
          >
            <Text color="white">{notification.message}</Text>
            <Button
              label="Dismiss"
              onClick={() => setNotification(null)}
              size="small"
            />
          </Box>
        </Layer>
      )}
    </Box>
  );
};

export default PlayerEdit;
