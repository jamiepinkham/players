import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Button,
  Spinner,
  Layer,
  TextInput,
  DataTable,
  Select,
  FormField,
  CheckBox,
} from "grommet";
import { Search, Edit, Trash } from "grommet-icons";

const ContractsTab = ({ allTeams, allSeasons, setNotification }) => {
  const [allContracts, setAllContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [contractsTeamFilter, setContractsTeamFilter] = useState('all');
  const [contractsPlayerSearch, setContractsPlayerSearch] = useState('');
  const [contractsSummerFilter, setContractsSummerFilter] = useState('all');
  const [contractsFranchiseFilter, setContractsFranchiseFilter] = useState('all');
  const [contractsActiveFilter, setContractsActiveFilter] = useState('all');
  const [contractsEndSeasonFilter, setContractsEndSeasonFilter] = useState('all');
  const [editingContract, setEditingContract] = useState(null);
  const [showEditContractModal, setShowEditContractModal] = useState(false);
  const [savingContract, setSavingContract] = useState(false);

  useEffect(() => {
    if (allContracts.length === 0) {
      fetchAllContracts();
    }
  }, []);

  const fetchAllContracts = async () => {
    setLoadingContracts(true);
    try {
      const response = await axios.get('/api/commissioner/contracts');
      setAllContracts(response.data.contracts || []);
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      setNotification({ message: 'Failed to load contracts', type: 'error' });
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleEditContract = (contract) => {
    setEditingContract({ ...contract });
    setShowEditContractModal(true);
  };

  const handleUpdateContract = async () => {
    if (!editingContract.amount || editingContract.amount <= 0) {
      setNotification({ message: 'Amount must be greater than 0', type: 'error' });
      return;
    }

    setSavingContract(true);
    try {
      await axios.patch(`/api/commissioner/contracts/${editingContract.id}`, {
        contract: {
          amount: editingContract.amount,
          summer: editingContract.summer,
          franchise: editingContract.franchise,
          active: editingContract.active
        }
      });
      setNotification({ message: 'Contract updated successfully!', type: 'success' });
      setShowEditContractModal(false);
      setEditingContract(null);
      await fetchAllContracts();
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to update contract',
        type: 'error'
      });
    } finally {
      setSavingContract(false);
    }
  };

  const handleDeleteContract = async (contractId, playerName) => {
    if (!confirm(`Are you sure you want to delete the contract for ${playerName}? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/commissioner/contracts/${contractId}`);
      setNotification({ message: 'Contract deleted successfully!', type: 'success' });
      await fetchAllContracts();
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to delete contract',
        type: 'error'
      });
    }
  };

  const filteredContracts = allContracts.filter(contract => {
    const matchesTeam = contractsTeamFilter === 'all' || contract.team_id.toString() === contractsTeamFilter;
    const matchesEndSeason = contractsEndSeasonFilter === 'all' || contract.last_season_id?.toString() === contractsEndSeasonFilter;
    const matchesPlayer = !contractsPlayerSearch || contract.player_name.toLowerCase().includes(contractsPlayerSearch.toLowerCase());
    const matchesSummer = contractsSummerFilter === 'all' ||
      (contractsSummerFilter === 'yes' && contract.summer) ||
      (contractsSummerFilter === 'no' && !contract.summer);
    const matchesFranchise = contractsFranchiseFilter === 'all' ||
      (contractsFranchiseFilter === 'yes' && contract.franchise) ||
      (contractsFranchiseFilter === 'no' && !contract.franchise);
    const matchesActive = contractsActiveFilter === 'all' ||
      (contractsActiveFilter === 'active' && contract.active) ||
      (contractsActiveFilter === 'inactive' && !contract.active);
    return matchesTeam && matchesEndSeason && matchesPlayer && matchesSummer && matchesFranchise && matchesActive;
  });

  return (
    <Box>
      <Heading level={2} margin={{ bottom: "medium" }}>📄 Contracts</Heading>

      {/* Filters */}
      <Box gap="medium" margin={{ bottom: "medium" }}>
        <Box direction="row" gap="medium">
          <Box width="medium">
            <FormField label="Team">
              <Select
                options={[
                  { label: 'All Teams', value: 'all' },
                  ...allTeams.map(t => ({ label: t.name, value: t.id.toString() }))
                ]}
                value={contractsTeamFilter}
                onChange={({ value }) => setContractsTeamFilter(value)}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
              />
            </FormField>
          </Box>

          <Box width="medium">
            <FormField label="End Season">
              <Select
                options={[
                  { label: 'All Seasons', value: 'all' },
                  ...allSeasons.map(s => ({ label: s.name, value: s.id.toString() }))
                ]}
                value={contractsEndSeasonFilter}
                onChange={({ value }) => setContractsEndSeasonFilter(value)}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
              />
            </FormField>
          </Box>

          <Box width="medium">
            <FormField label="Player Search">
              <TextInput
                placeholder="Search by player name..."
                value={contractsPlayerSearch}
                onChange={(e) => setContractsPlayerSearch(e.target.value)}
                icon={<Search />}
              />
            </FormField>
          </Box>
        </Box>

        <Box direction="row" gap="medium">
          <Box width="small">
            <FormField label="Summer">
              <Select
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' }
                ]}
                value={contractsSummerFilter}
                onChange={({ value }) => setContractsSummerFilter(value)}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
              />
            </FormField>
          </Box>

          <Box width="small">
            <FormField label="Franchise">
              <Select
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' }
                ]}
                value={contractsFranchiseFilter}
                onChange={({ value }) => setContractsFranchiseFilter(value)}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
              />
            </FormField>
          </Box>

          <Box width="small">
            <FormField label="Status">
              <Select
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' }
                ]}
                value={contractsActiveFilter}
                onChange={({ value }) => setContractsActiveFilter(value)}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
              />
            </FormField>
          </Box>
        </Box>
      </Box>

      {/* Contracts Table */}
      {loadingContracts ? (
        <Box align="center" pad="large">
          <Spinner />
          <Text margin={{ top: 'small' }}>Loading contracts...</Text>
        </Box>
      ) : (
        <DataTable
          columns={[
            {
              property: 'team_name',
              header: 'Team',
              sortable: true
            },
            {
              property: 'player_name',
              header: 'Player',
              primary: true,
              sortable: true
            },
            {
              property: 'amount',
              header: 'Amount',
              sortable: true,
              render: datum => new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(datum.amount)
            },
            {
              property: 'first_season_name',
              header: 'Start Season',
              sortable: true
            },
            {
              property: 'last_season_name',
              header: 'End Season',
              sortable: true
            },
            {
              property: 'summer',
              header: 'Summer',
              render: datum => (
                <Box
                  background={datum.summer ? 'status-ok' : 'light-4'}
                  pad={{ horizontal: 'small', vertical: 'xxsmall' }}
                  round="xsmall"
                >
                  <Text size="xsmall" weight="bold">
                    {datum.summer ? 'YES' : 'NO'}
                  </Text>
                </Box>
              )
            },
            {
              property: 'franchise',
              header: 'Franchise',
              render: datum => (
                <Box
                  background={datum.franchise ? 'status-warning' : 'light-4'}
                  pad={{ horizontal: 'small', vertical: 'xxsmall' }}
                  round="xsmall"
                >
                  <Text size="xsmall" weight="bold">
                    {datum.franchise ? 'YES' : 'NO'}
                  </Text>
                </Box>
              )
            },
            {
              property: 'active',
              header: 'Active',
              render: datum => (
                <Box
                  background={datum.active ? 'brand' : 'status-critical'}
                  pad={{ horizontal: 'small', vertical: 'xxsmall' }}
                  round="xsmall"
                >
                  <Text size="xsmall" weight="bold" color="white">
                    {datum.active ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </Box>
              )
            },
            {
              property: 'actions',
              header: 'Actions',
              render: datum => (
                <Box direction="row" gap="xsmall">
                  <Button
                    icon={<Edit size="small" />}
                    onClick={() => handleEditContract(datum)}
                    size="small"
                    tip="Edit contract"
                  />
                  <Button
                    icon={<Trash size="small" />}
                    onClick={() => handleDeleteContract(datum.id, datum.player_name)}
                    size="small"
                    color="status-error"
                    tip="Delete contract"
                  />
                </Box>
              )
            }
          ]}
          data={filteredContracts}
          primaryKey="id"
          sort={{ property: 'team_name', direction: 'asc' }}
        />
      )}

      {/* Edit Contract Modal */}
      {showEditContractModal && editingContract && (
        <Layer
          position="center"
          onEsc={() => setShowEditContractModal(false)}
          onClickOutside={() => setShowEditContractModal(false)}
        >
          <Box pad="medium" gap="small" width="medium">
            <Heading level={3} margin="none">Edit Contract</Heading>

            <Box gap="xsmall" margin={{ bottom: 'small' }}>
              <Text weight="bold">{editingContract.player_name}</Text>
              <Text size="small" color="dark-4">Team: {editingContract.team_name}</Text>
              <Text size="small" color="dark-4">
                {editingContract.first_season_name} - {editingContract.last_season_name}
              </Text>
            </Box>

            <FormField label="Annual Amount" required>
              <Box direction="row" gap="xsmall" align="center">
                <Text>$</Text>
                <TextInput
                  type="number"
                  value={editingContract.amount}
                  onChange={(e) => setEditingContract({
                    ...editingContract,
                    amount: parseInt(e.target.value) || 0
                  })}
                />
              </Box>
            </FormField>

            <CheckBox
              checked={editingContract.summer || false}
              label="Summer Contract"
              onChange={(e) => setEditingContract({
                ...editingContract,
                summer: e.target.checked
              })}
            />

            <CheckBox
              checked={editingContract.franchise || false}
              label="Franchise Tag"
              onChange={(e) => setEditingContract({
                ...editingContract,
                franchise: e.target.checked
              })}
            />

            <CheckBox
              checked={editingContract.active !== false}
              label="Active Contract"
              onChange={(e) => setEditingContract({
                ...editingContract,
                active: e.target.checked
              })}
            />

            <Box direction="row" gap="small" justify="end" margin={{ top: 'small' }}>
              <Button
                label="Cancel"
                onClick={() => {
                  setShowEditContractModal(false);
                  setEditingContract(null);
                }}
              />
              <Button
                label={savingContract ? 'Saving...' : 'Save Changes'}
                primary
                onClick={handleUpdateContract}
                disabled={savingContract}
              />
            </Box>
          </Box>
        </Layer>
      )}
    </Box>
  );
};

export default ContractsTab;
