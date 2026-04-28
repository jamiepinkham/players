import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Anchor,
  Layer,
  TextInput,
  DataTable,
  Select,
  FormField,
  CheckBox,
  TextArea,
} from "grommet";
import {
  StatusGood,
  StatusWarning,
  StatusCritical,
  DocumentText,
  Search,
  Edit,
  Trash,
  User,
  Organization,
} from "grommet-icons";
import TradeDetailModal from "./TradeDetailModal";
import ContractsTab from "./ContractsTab";
import BidsTab from "./BidsTab";
import PlayersTab from "./PlayersTab";
import TradesTab from "./TradesTab";
import TeamsTab from "./TeamsTab";
import UsersTab from "./UsersTab";
import SeasonsTab from "./SeasonsTab";

const CommissionerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [convertBidsPreview, setConvertBidsPreview] = useState(null);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
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

  // Shared data for dropdowns in other tabs
  const [allSeasons, setAllSeasons] = useState([]);
  const [allTeams, setAllTeams] = useState([]);


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/commissioner");
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviews = async () => {
    setLoadingPreviews(true);
    try {
      const [convertBidsRes, seasonSwitchRes] = await Promise.all([
        axios.get("/api/commissioner/preview/convert_bids"),
        axios.get("/api/commissioner/preview/season_switch")
      ]);
      setConvertBidsPreview(convertBidsRes.data.output);
      setSeasonSwitchPreview(seasonSwitchRes.data.output);
    } catch (err) {
      console.error("Failed to load previews:", err);
    } finally {
      setLoadingPreviews(false);
    }
  };

  const recalculateFreeAgents = async () => {
    setRecalculatingFAs(true);
    try {
      const response = await axios.post("/api/commissioner/free_agents/recalculate");
      setNotification({
        message: `Free agents recalculated! Updated ${response.data.updated} players (${response.data.changes.length} changes made).`,
        type: 'success'
      });
      await fetchDashboardData(); // Refresh dashboard data
      await fetchFaPreview(); // Refresh preview to clear issues
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to recalculate free agents',
        type: 'error'
      });
    } finally {
      setRecalculatingFAs(false);
    }
  };

  const fetchActiveBids = async (faPeriodId = null) => {
    setLoadingBids(true);
    try {
      const url = faPeriodId
        ? `/api/commissioner/bids?fa_period_id=${faPeriodId}`
        : '/api/commissioner/bids';
      const response = await axios.get(url);
      setActiveBids(response.data);

      // Auto-select the active period if none is selected
      if (!selectedFaPeriodId && response.data.fa_period) {
        setSelectedFaPeriodId(response.data.fa_period.id);
        setSelectedSeasonId(response.data.fa_period.season_id);
      }
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
        message: response.data.message || 'Bids converted successfully',
        type: 'success'
      });
      await fetchActiveBids(); // Refresh bids list
      await fetchDashboardData(); // Refresh dashboard
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to convert bids',
        type: 'error'
      });
    } finally {
      setConvertingBids(false);
    }
  };

  const fetchAllSeasons = async () => {
    try {
      const response = await axios.get("/api/commissioner/seasons");
      setAllSeasons(response.data.seasons);
    } catch (err) {
      console.error("Failed to load seasons:", err);
      setNotification({
        message: 'Failed to load seasons',
        type: 'error'
      });
    }
  };

  const fetchAllTeams = async () => {
    try {
      const response = await axios.get('/api/commissioner/teams');
      setAllTeams(response.data.teams);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setNotification({ message: 'Failed to load teams', type: 'error' });
    }
  };

  useEffect(() => {
    if (activeSection === 'overview') {
      fetchAllSeasons();
    } else if (activeSection === 'bids' || activeSection === 'contracts') {
      // Load teams and seasons for dropdowns if not already loaded
      if (allTeams.length === 0) {
        fetchAllTeams();
      }
      if (allSeasons.length === 0) {
        fetchAllSeasons();
      }
    }
  }, [activeSection]);

  // Auto-select active season and FA period when seasons are loaded for bids section
  useEffect(() => {
    if (activeSection === 'bids' && allSeasons.length > 0 && !selectedSeasonId) {
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
  }, [activeSection, allSeasons, selectedSeasonId]);

  if (loading) {
    return (
      <Box fill align="center" justify="center" pad="large">
        <Spinner size="large" />
        <Text margin={{ top: "medium" }}>Loading dashboard...</Text>
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
          onClick={fetchDashboardData}
          margin={{ top: "medium" }}
        />
      </Box>
    );
  }

  const { season, freeAgents, trades } = dashboardData || {};

  const menuItems = [
    { id: 'overview', label: '📅 Seasons' },
    { id: 'teams', label: '🏢 Teams' },
    { id: 'users', label: '👤 Users' },
    { id: 'trades', label: '🤝 Trades' },
    { id: 'free-agents', label: '👥 Players' },
    { id: 'contracts', label: '📄 Contracts' },
    { id: 'bids', label: '💰 Free Agency' },
  ];

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Sidebar Navigation */}
        <div style={{
          width: '280px',
          background: '#f7f7f7',
          borderRight: '1px solid #e0e0e0',
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {menuItems.map(item => (
            <div
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: activeSection === item.id ? '#7D4CDB' : 'transparent',
                color: activeSection === item.id ? 'white' : '#333',
                fontWeight: activeSection === item.id ? 'bold' : 'normal',
                borderLeft: activeSection === item.id ? '4px solid #7D4CDB' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.background = '#efefef';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
          {activeSection === 'overview' && (
            <SeasonsTab
              season={season}
              freeAgents={freeAgents}
              setNotification={setNotification}
            />
          )}

          {activeSection === 'teams' && (
            <TeamsTab setNotification={setNotification} />
          )}

          {activeSection === 'users' && (
            <UsersTab
              allTeams={allTeams}
              setNotification={setNotification}
            />
          )}

          {activeSection === 'trades' && (
            <TradesTab
              trades={trades}
              setNotification={setNotification}
              onTradeUpdate={fetchDashboardData}
            />
          )}

          {activeSection === 'free-agents' && (
            <PlayersTab
              freeAgents={freeAgents}
              season={season}
              setNotification={setNotification}
            />
          )}


          {/* Contracts Section */}
          {activeSection === "contracts" && (
            <ContractsTab
              allTeams={allTeams}
              allSeasons={allSeasons}
              setNotification={setNotification}
            />
          )}
          {activeSection === 'bids' && (
            <BidsTab
              allSeasons={allSeasons}
              allTeams={allTeams}
              setNotification={setNotification}
            />
          )}
        </div>
      </div>

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
            background={notification.type === 'error' ? 'status-error' : 'status-ok'}
            round="small"
            elevation="medium"
          >
            <Text color="white">{notification.message}</Text>
            <Button label="Dismiss" onClick={() => setNotification(null)} size="small" />
          </Box>
        </Layer>
      )}
    </>
  );
};

export default CommissionerDashboard;
