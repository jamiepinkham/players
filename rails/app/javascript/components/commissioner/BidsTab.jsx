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
} from "grommet";
import { Search, Edit, Trash } from "grommet-icons";

const BidsTab = ({ allSeasons, allTeams, setNotification }) => {
  const [activeBids, setActiveBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [convertingBids, setConvertingBids] = useState(false);
  const [selectedFaPeriodId, setSelectedFaPeriodId] = useState(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [bidsStatusFilter, setBidsStatusFilter] = useState('all');
  const [bidsTeamFilter, setBidsTeamFilter] = useState('all');
  const [bidsPlayerSearch, setBidsPlayerSearch] = useState('');
  const [editingBid, setEditingBid] = useState(null);
  const [showEditBidModal, setShowEditBidModal] = useState(false);
  const [savingBid, setSavingBid] = useState(false);

  // Auto-select active season and FA period on mount
  useEffect(() => {
    if (allSeasons.length > 0 && !selectedSeasonId) {
      const activeSeason = allSeasons.find(s => s.is_active);
      if (activeSeason) {
        setSelectedSeasonId(activeSeason.id);
        const activePeriod = activeSeason.free_agency_periods?.find(p => p.is_active);
        if (activePeriod) {
          setSelectedFaPeriodId(activePeriod.id);
          fetchActiveBids(activePeriod.id);
        }
      }
    }
  }, [allSeasons, selectedSeasonId]);

  const fetchActiveBids = async (faPeriodId = null) => {
    setLoadingBids(true);
    try {
      const url = faPeriodId
        ? `/api/commissioner/bids?fa_period_id=${faPeriodId}`
        : '/api/commissioner/bids';
      const response = await axios.get(url);
      setActiveBids(response.data);
    } catch (err) {
      console.error("Failed to load bids:", err);
      setNotification({
        message: 'Failed to load active bids',
        type: 'error'
      });
    } finally {
      setLoadingBids(false);
    }
  };

  const handleEditBid = (bid) => {
    setEditingBid({ ...bid });
    setShowEditBidModal(true);
  };

  const handleUpdateBid = async () => {
    if (!editingBid.annual_amount || editingBid.annual_amount <= 0) {
      setNotification({ message: 'Annual amount must be greater than 0', type: 'error' });
      return;
    }

    setSavingBid(true);
    try {
      await axios.patch(`/api/commissioner/bids/${editingBid.id}`, {
        bid: {
          annual_amount: editingBid.annual_amount,
          contract_length: editingBid.contract_length
        }
      });
      setNotification({ message: 'Bid updated successfully!', type: 'success' });
      setShowEditBidModal(false);
      setEditingBid(null);
      await fetchActiveBids(selectedFaPeriodId);
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to update bid',
        type: 'error'
      });
    } finally {
      setSavingBid(false);
    }
  };

  const handleDeleteBid = async (bidId, playerName) => {
    if (!confirm(`Are you sure you want to delete the bid for ${playerName}? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/commissioner/bids/${bidId}`);
      setNotification({ message: 'Bid deleted successfully!', type: 'success' });
      await fetchActiveBids(selectedFaPeriodId);
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to delete bid',
        type: 'error'
      });
    }
  };

  const handleConvertBids = async () => {
    if (!confirm("Are you sure you want to convert all leading bids to contracts? This action cannot be undone.")) {
      return;
    }

    setConvertingBids(true);
    try {
      const response = await axios.post("/api/commissioner/convert_bids");
      setNotification({
        message: `Successfully converted ${response.data.contracts_created} bids to contracts`,
        type: 'success'
      });
      await fetchActiveBids(selectedFaPeriodId);
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to convert bids',
        type: 'error'
      });
    } finally {
      setConvertingBids(false);
    }
  };

  const selectedSeason = allSeasons.find(s => s.id === selectedSeasonId);
  const faPeriodsForSeason = selectedSeason?.free_agency_periods || [];

  const filteredBids = activeBids.bids?.filter(bid => {
    const matchesStatus = bidsStatusFilter === 'all' || bid.status === bidsStatusFilter;
    const matchesTeam = bidsTeamFilter === 'all' || bid.team_id.toString() === bidsTeamFilter;
    const matchesPlayer = !bidsPlayerSearch || bid.player_name.toLowerCase().includes(bidsPlayerSearch.toLowerCase());
    return matchesStatus && matchesTeam && matchesPlayer;
  }) || [];

  return (
    <Box>
      <Heading level={2} margin={{ bottom: "medium" }}>💰 Free Agency Management</Heading>

      {/* Season and Free Agency Period Selector */}
      <Box direction="row" gap="medium" margin={{ bottom: "medium" }}>
        <Box width="medium">
          <FormField label="Season">
            <Select
              options={allSeasons.map(s => ({ label: s.name, value: s.id }))}
              value={selectedSeasonId}
              onChange={({ option }) => {
                setSelectedSeasonId(option.value);
                setSelectedFaPeriodId(null);
                setActiveBids([]);
                setBidsStatusFilter('all');
                setBidsTeamFilter('all');
                setBidsPlayerSearch('');
              }}
              labelKey="label"
              valueKey={{ key: 'value', reduce: true }}
              placeholder="Select season..."
            />
          </FormField>
        </Box>

        {selectedSeasonId && (
          <Box width="medium">
            <FormField label="Free Agency Period">
              <Select
                options={faPeriodsForSeason.map(p => ({
                  label: `Period ${p.id}${p.is_active ? ' (Active)' : ''}`,
                  value: p.id
                }))}
                value={selectedFaPeriodId}
                onChange={({ option }) => {
                  setSelectedFaPeriodId(option.value);
                  fetchActiveBids(option.value);
                }}
                labelKey="label"
                valueKey={{ key: 'value', reduce: true }}
                placeholder="Select FA period..."
              />
            </FormField>
          </Box>
        )}
      </Box>

      {selectedFaPeriodId ? (
        (() => {
          if (loadingBids) {
            return (
              <Box align="center" pad="large">
                <Spinner />
                <Text margin={{ top: 'small' }}>Loading bids...</Text>
              </Box>
            );
          }

          return (
            <Box gap="medium">
              {/* Summary Stats */}
              <Box direction="row" gap="medium">
                <Box background="light-2" pad="small" round="small">
                  <Text size="small" color="dark-4">Total Bids</Text>
                  <Text size="xlarge" weight="bold">{activeBids.total_count || 0}</Text>
                </Box>
                <Box background="status-ok" pad="small" round="small">
                  <Text size="small" color="white">Leading Bids</Text>
                  <Text size="xlarge" weight="bold" color="white">{activeBids.leading_count || 0}</Text>
                </Box>
                <Box background="accent-2" pad="small" round="small">
                  <Text size="small" color="white">Active Bids</Text>
                  <Text size="xlarge" weight="bold" color="white">{activeBids.active_count || 0}</Text>
                </Box>
              </Box>

              {/* Convert Bids Button */}
              {activeBids.leading_count > 0 && (
                <Box>
                  <Button
                    label={convertingBids ? "Converting..." : "Convert Leading Bids to Contracts"}
                    primary
                    color="status-ok"
                    onClick={handleConvertBids}
                    disabled={convertingBids}
                  />
                </Box>
              )}

              {/* Filters */}
              <Box direction="row" gap="medium">
                <Box width="small">
                  <FormField label="Status">
                    <Select
                      options={[
                        { label: 'All', value: 'all' },
                        { label: 'Leading', value: 'leading' },
                        { label: 'Active', value: 'active' },
                        { label: 'Converted', value: 'converted' },
                        { label: 'Inactive', value: 'inactive' }
                      ]}
                      value={bidsStatusFilter}
                      onChange={({ value }) => setBidsStatusFilter(value)}
                      labelKey="label"
                      valueKey={{ key: 'value', reduce: true }}
                    />
                  </FormField>
                </Box>

                <Box width="medium">
                  <FormField label="Team">
                    <Select
                      options={[
                        { label: 'All Teams', value: 'all' },
                        ...allTeams.map(t => ({ label: t.name, value: t.id.toString() }))
                      ]}
                      value={bidsTeamFilter}
                      onChange={({ value }) => setBidsTeamFilter(value)}
                      labelKey="label"
                      valueKey={{ key: 'value', reduce: true }}
                    />
                  </FormField>
                </Box>

                <Box width="medium">
                  <FormField label="Player Search">
                    <TextInput
                      placeholder="Search by player name..."
                      value={bidsPlayerSearch}
                      onChange={(e) => setBidsPlayerSearch(e.target.value)}
                      icon={<Search />}
                    />
                  </FormField>
                </Box>
              </Box>

              {/* Bids Table */}
              <DataTable
                columns={[
                  {
                    property: 'player_name',
                    header: 'Player',
                    primary: true,
                    sortable: true
                  },
                  {
                    property: 'team_name',
                    header: 'Team',
                    sortable: true
                  },
                  {
                    property: 'annual_amount',
                    header: 'Annual',
                    sortable: true,
                    render: datum => new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0
                    }).format(datum.annual_amount)
                  },
                  {
                    property: 'contract_length',
                    header: 'Years',
                    sortable: true
                  },
                  {
                    property: 'total_amount',
                    header: 'Total',
                    sortable: true,
                    render: datum => new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0
                    }).format(datum.total_amount)
                  },
                  {
                    property: 'status',
                    header: 'Status',
                    sortable: true,
                    render: datum => {
                      const statusColors = {
                        active: 'accent-2',
                        leading: 'status-ok',
                        converted: 'brand',
                        inactive: 'dark-4'
                      };
                      return (
                        <Box
                          background={statusColors[datum.status]}
                          pad={{ horizontal: 'small', vertical: 'xsmall' }}
                          round="xsmall"
                        >
                          <Text size="small" weight="bold" color="white">
                            {datum.status.toUpperCase()}
                          </Text>
                        </Box>
                      );
                    }
                  },
                  {
                    property: 'created_at',
                    header: 'Placed',
                    sortable: true,
                    render: datum => new Date(datum.created_at).toLocaleDateString()
                  },
                  {
                    property: 'actions',
                    header: 'Actions',
                    render: datum => (
                      <Box direction="row" gap="xsmall">
                        <Button
                          icon={<Edit size="small" />}
                          onClick={() => handleEditBid(datum)}
                          size="small"
                          tip="Edit bid"
                        />
                        <Button
                          icon={<Trash size="small" />}
                          onClick={() => handleDeleteBid(datum.id, datum.player_name)}
                          size="small"
                          color="status-error"
                          tip="Delete bid"
                        />
                      </Box>
                    )
                  }
                ]}
                data={filteredBids}
                primaryKey="id"
                sort={{ property: 'created_at', direction: 'desc' }}
              />

              {filteredBids.length === 0 && (
                <Box align="center" pad="large">
                  <Text color="dark-6">No bids found</Text>
                </Box>
              )}
            </Box>
          );
        })()
      ) : (
        <Box align="center" pad="large">
          <Text color="dark-6">Select a season and free agency period to view bids</Text>
        </Box>
      )}

      {/* Edit Bid Modal */}
      {showEditBidModal && editingBid && (
        <Layer
          position="center"
          onEsc={() => setShowEditBidModal(false)}
          onClickOutside={() => setShowEditBidModal(false)}
        >
          <Box pad="medium" gap="small" width="medium">
            <Heading level={3} margin="none">Edit Bid</Heading>

            <Box gap="xsmall" margin={{ bottom: 'small' }}>
              <Text weight="bold">{editingBid.player_name}</Text>
              <Text size="small" color="dark-4">Team: {editingBid.team_name}</Text>
            </Box>

            <FormField label="Annual Amount" required>
              <Box direction="row" gap="xsmall" align="center">
                <Text>$</Text>
                <TextInput
                  type="number"
                  value={editingBid.annual_amount}
                  onChange={(e) => setEditingBid({
                    ...editingBid,
                    annual_amount: parseInt(e.target.value) || 0,
                    total_amount: (parseInt(e.target.value) || 0) * editingBid.contract_length
                  })}
                />
              </Box>
            </FormField>

            <FormField label="Contract Length (Years)" required>
              <TextInput
                type="number"
                min="1"
                max="5"
                value={editingBid.contract_length}
                onChange={(e) => setEditingBid({
                  ...editingBid,
                  contract_length: parseInt(e.target.value) || 1,
                  total_amount: editingBid.annual_amount * (parseInt(e.target.value) || 1)
                })}
              />
            </FormField>

            <Box background="light-2" pad="small" round="xsmall">
              <Text size="small" color="dark-4">Total Contract Value</Text>
              <Text size="large" weight="bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(editingBid.total_amount || 0)}
              </Text>
            </Box>

            <Box direction="row" gap="small" justify="end" margin={{ top: 'small' }}>
              <Button
                label="Cancel"
                onClick={() => {
                  setShowEditBidModal(false);
                  setEditingBid(null);
                }}
              />
              <Button
                label={savingBid ? 'Saving...' : 'Save Changes'}
                primary
                onClick={handleUpdateBid}
                disabled={savingBid}
              />
            </Box>
          </Box>
        </Layer>
      )}
    </Box>
  );
};

export default BidsTab;
