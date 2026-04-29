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
  Layer,
  TextInput,
  Select,
  FormField,
  CheckBox,
} from "grommet";
import { Edit } from "grommet-icons";

const SeasonsTab = ({ season, freeAgents, setNotification }) => {
  const navigate = useNavigate();
  const [allSeasons, setAllSeasons] = useState([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [showCreateSeasonModal, setShowCreateSeasonModal] = useState(false);
  const [newSeason, setNewSeason] = useState({
    name: '',
    target_stat_year: '',
    start_date: '',
    end_date: '',
    is_active: false,
    next_season_id: ''
  });
  const [creatingSeason, setCreatingSeason] = useState(false);
  const [showEditSeasonModal, setShowEditSeasonModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [updatingSeason, setUpdatingSeason] = useState(false);

  useEffect(() => {
    fetchAllSeasons();
  }, []);

  const fetchAllSeasons = async () => {
    setLoadingSeasons(true);
    try {
      const response = await axios.get("/api/commissioner/seasons");
      setAllSeasons(response.data.seasons);
    } catch (err) {
      console.error("Failed to load seasons:", err);
      setNotification({
        message: 'Failed to load seasons',
        type: 'error'
      });
    } finally {
      setLoadingSeasons(false);
    }
  };

  const handleCreateSeason = async () => {
    setCreatingSeason(true);
    try {
      const response = await axios.post("/api/commissioner/seasons", { season: newSeason });
      setNotification({
        message: `Season "${response.data.season.name}" created successfully!`,
        type: 'success'
      });
      setShowCreateSeasonModal(false);
      setNewSeason({
        name: '',
        target_stat_year: '',
        start_date: '',
        end_date: '',
        is_active: false,
        next_season_id: ''
      });
      await fetchAllSeasons();
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to create season',
        type: 'error'
      });
    } finally {
      setCreatingSeason(false);
    }
  };

  const handleEditSeason = (season) => {
    // Convert date format from "Jan 01, 2025" to "2025-01-01"
    const convertToInputDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    };

    setEditingSeason({
      id: season.id,
      name: season.name,
      target_stat_year: season.target_stat_year,
      start_date: convertToInputDate(season.start_date),
      end_date: convertToInputDate(season.end_date),
      is_active: season.is_active,
      next_season_id: season.next_season_id || ''
    });
    setShowEditSeasonModal(true);
  };

  const handleUpdateSeason = async () => {
    setUpdatingSeason(true);
    try {
      const response = await axios.patch(`/api/commissioner/seasons/${editingSeason.id}`, {
        season: {
          name: editingSeason.name,
          target_stat_year: editingSeason.target_stat_year,
          start_date: editingSeason.start_date,
          end_date: editingSeason.end_date,
          is_active: editingSeason.is_active,
          next_season_id: editingSeason.next_season_id
        }
      });
      setNotification({
        message: `Season "${response.data.season.name}" updated successfully!`,
        type: 'success'
      });
      setShowEditSeasonModal(false);
      setEditingSeason(null);
      await fetchAllSeasons();
    } catch (err) {
      setNotification({
        message: err.response?.data?.error || 'Failed to update season',
        type: 'error'
      });
    } finally {
      setUpdatingSeason(false);
    }
  };

  return (
    <Card background="light-1">
      <CardHeader pad="medium" background="brand">
        <Heading level={3} margin="none" color="white">
          📅 Season Overview
        </Heading>
      </CardHeader>
      <CardBody pad="medium">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Current Season */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#7D4CDB', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Current Season
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                  SEASON NAME
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {season?.name || "N/A"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                  TARGET STAT YEAR
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {season?.targetStatYear || "N/A"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                  SEASON DATES
                </div>
                <div style={{ fontSize: '14px' }}>
                  {season?.startDate} - {season?.endDate}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                  FREE AGENCY STATUS
                </div>
                <div style={{
                  background: season?.freeAgencyActive ? '#00C781' : '#FFAA15',
                  padding: '12px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                    {season?.freeAgencyActive ? '✓' : '⚠'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'white', opacity: 0.9 }}>
                    {season?.freeAgencyActive
                      ? `Active (${season?.maxBids} bids max)`
                      : 'Inactive'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Season */}
          {season?.nextSeasonData && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#7D4CDB', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Next Season
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                    SEASON NAME
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {season.nextSeasonData.name || "N/A"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                    TARGET STAT YEAR
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {season.nextSeasonData.targetStatYear || "N/A"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                    SEASON DATES
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    {season.nextSeasonData.startDate} - {season.nextSeasonData.endDate}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                    FREE AGENCY STATUS
                  </div>
                  <div
                    onClick={() => navigate("/commissioner/players?status=expiring")}
                    style={{
                      background: '#FF4040',
                      padding: '12px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                      {season.expiringContracts || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: 'white', opacity: 0.9 }}>
                      Contracts expiring
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player Contract Status */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #EDEDED' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#7D4CDB', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Player Contract Status
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div
              onClick={() => navigate("/commissioner/players?status=free_agent")}
              style={{
                background: '#00C781',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>
                {freeAgents?.count || 0}
              </div>
              <div style={{ fontSize: '14px', color: 'white' }}>✅ Free Agents</div>
            </div>

            <div
              onClick={() => navigate("/commissioner/players?status=under_contract")}
              style={{
                background: '#FF4040',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>
                {freeAgents?.underContract || 0}
              </div>
              <div style={{ fontSize: '14px', color: 'white' }}>⛔ Under Contract</div>
            </div>

            <div
              onClick={() => navigate("/commissioner/players?status=ineligible")}
              style={{
                background: '#FFAA15',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>
                {freeAgents?.ineligible || 0}
              </div>
              <div style={{ fontSize: '14px', color: 'white' }}>⚠️ Ineligible</div>
            </div>
          </div>
        </div>

        {/* All Seasons List */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #EDEDED' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#7D4CDB', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>All Seasons ({allSeasons.length})</span>
            <Button
              label="Create New Season"
              size="small"
              primary
              onClick={() => setShowCreateSeasonModal(true)}
            />
          </div>

          {loadingSeasons ? (
            <Box align="center" pad="medium">
              <Spinner size="medium" />
            </Box>
          ) : (
            <Box gap="small">
              {allSeasons.map(season => (
                <Card key={season.id} background="light-1">
                  <CardBody pad="small">
                    <Box direction="row" justify="between" align="center">
                      <Box flex>
                        <Box direction="row" gap="small" align="center" margin={{ bottom: "xsmall" }}>
                          <Text weight="bold" size="large">{season.name}</Text>
                          {season.is_active && (
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
                          {season.free_agency_active && (
                            <Box
                              background="brand"
                              pad={{ horizontal: "xsmall", vertical: "xxsmall" }}
                              round="xsmall"
                            >
                              <Text size="xsmall" weight="bold" color="white">
                                FA ACTIVE
                              </Text>
                            </Box>
                          )}
                        </Box>

                        <Box direction="row" gap="medium" wrap>
                          <Text size="small" color="dark-6">
                            <strong>Dates:</strong> {season.start_date} - {season.end_date}
                          </Text>
                          <Text size="small" color="dark-6">
                            <strong>Stats Year:</strong> {season.target_stat_year}
                          </Text>
                          {season.next_season_name && (
                            <Text size="small" color="dark-6">
                              <strong>Next:</strong> {season.next_season_name}
                            </Text>
                          )}
                          <Text size="small" color="dark-6">
                            <strong>Active Contracts:</strong> {season.contracts_count}
                          </Text>
                        </Box>
                      </Box>
                      <Button
                        icon={<Edit />}
                        onClick={() => handleEditSeason(season)}
                        tip="Edit season"
                      />
                    </Box>
                  </CardBody>
                </Card>
              ))}
            </Box>
          )}
        </div>

        {/* Season Management */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #EDEDED' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#7D4CDB', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Season Management
          </div>
          <Box direction="row" gap="small" wrap>
            <Button
              label="Switch to Next Season"
              primary
              color="status-critical"
              onClick={() => {
                if (confirm("Are you sure you want to switch to the next season? This is a major operation that cannot be undone.")) {
                  alert("Season switch functionality coming soon");
                }
              }}
            />
          </Box>
        </div>
      </CardBody>

      {/* Create Season Modal */}
      {showCreateSeasonModal && (
        <Layer
          onEsc={() => setShowCreateSeasonModal(false)}
          onClickOutside={() => setShowCreateSeasonModal(false)}
        >
          <Box pad="medium" gap="small" width="large">
            <Heading level={3} margin="none">Create New Season</Heading>

            <FormField label="Season Name" required>
              <TextInput
                value={newSeason.name}
                onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
                placeholder="e.g., BMPL 2027"
              />
            </FormField>

            <FormField label="Target Stats Year" required>
              <TextInput
                type="number"
                value={newSeason.target_stat_year}
                onChange={(e) => setNewSeason({ ...newSeason, target_stat_year: e.target.value })}
                placeholder="e.g., 2026"
              />
            </FormField>

            <Box direction="row" gap="small">
              <FormField label="Start Date" required flex>
                <TextInput
                  type="date"
                  value={newSeason.start_date}
                  onChange={(e) => setNewSeason({ ...newSeason, start_date: e.target.value })}
                />
              </FormField>

              <FormField label="End Date" required flex>
                <TextInput
                  type="date"
                  value={newSeason.end_date}
                  onChange={(e) => setNewSeason({ ...newSeason, end_date: e.target.value })}
                />
              </FormField>
            </Box>

            <FormField label="Previous Season">
              <Select
                options={[
                  { label: 'None', value: '' },
                  ...allSeasons
                    .filter(s => !s.next_season_id)
                    .map(s => ({ label: s.name, value: s.id }))
                ]}
                value={newSeason.previous_season_id}
                onChange={({ option }) => setNewSeason({ ...newSeason, previous_season_id: option.value })}
                labelKey="label"
                valueKey="value"
              />
            </FormField>

            <CheckBox
              checked={newSeason.is_active}
              label="Set as Active Season"
              onChange={(e) => setNewSeason({ ...newSeason, is_active: e.target.checked })}
            />

            <Box direction="row" gap="small" justify="end" margin={{ top: "small" }}>
              <Button
                label="Cancel"
                onClick={() => setShowCreateSeasonModal(false)}
              />
              <Button
                label={creatingSeason ? "Creating..." : "Create Season"}
                primary
                onClick={handleCreateSeason}
                disabled={creatingSeason || !newSeason.name || !newSeason.target_stat_year || !newSeason.start_date || !newSeason.end_date}
              />
            </Box>
          </Box>
        </Layer>
      )}

      {/* Edit Season Modal */}
      {showEditSeasonModal && editingSeason && (
        <Layer
          onEsc={() => setShowEditSeasonModal(false)}
          onClickOutside={() => setShowEditSeasonModal(false)}
        >
          <Box pad="medium" gap="small" width="large">
            <Heading level={3} margin="none">Edit Season</Heading>

            <FormField label="Season Name" required>
              <TextInput
                value={editingSeason.name}
                onChange={(e) => setEditingSeason({ ...editingSeason, name: e.target.value })}
                placeholder="e.g., BMPL 2027"
              />
            </FormField>

            <FormField label="Target Stats Year" required>
              <TextInput
                type="number"
                value={editingSeason.target_stat_year}
                onChange={(e) => setEditingSeason({ ...editingSeason, target_stat_year: e.target.value })}
                placeholder="e.g., 2026"
              />
            </FormField>

            <Box direction="row" gap="small">
              <FormField label="Start Date" required flex>
                <TextInput
                  type="date"
                  value={editingSeason.start_date}
                  onChange={(e) => setEditingSeason({ ...editingSeason, start_date: e.target.value })}
                />
              </FormField>

              <FormField label="End Date" required flex>
                <TextInput
                  type="date"
                  value={editingSeason.end_date}
                  onChange={(e) => setEditingSeason({ ...editingSeason, end_date: e.target.value })}
                />
              </FormField>
            </Box>

            <FormField label="Next Season">
              <Select
                options={[{ label: 'None', value: '' }, ...allSeasons.filter(s => s.id !== editingSeason.id).map(s => ({ label: s.name, value: s.id }))]}
                value={editingSeason.next_season_id}
                onChange={({ option }) => setEditingSeason({ ...editingSeason, next_season_id: option.value })}
                labelKey="label"
                valueKey="value"
              />
            </FormField>

            <CheckBox
              checked={editingSeason.is_active}
              label="Set as Active Season"
              onChange={(e) => setEditingSeason({ ...editingSeason, is_active: e.target.checked })}
            />

            <Box direction="row" gap="small" justify="end" margin={{ top: "small" }}>
              <Button
                label="Cancel"
                onClick={() => {
                  setShowEditSeasonModal(false);
                  setEditingSeason(null);
                }}
              />
              <Button
                label={updatingSeason ? "Updating..." : "Update Season"}
                primary
                onClick={handleUpdateSeason}
                disabled={updatingSeason || !editingSeason.name || !editingSeason.target_stat_year || !editingSeason.start_date || !editingSeason.end_date}
              />
            </Box>
          </Box>
        </Layer>
      )}
    </Card>
  );
};

export default SeasonsTab;
