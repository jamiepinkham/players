import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Heading, Text, Button, Spinner } from "grommet";
import { Previous, Sync } from "grommet-icons";
import TradeDetailModal from "./TradeDetailModal";

const TradesList = () => {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [trades, statusFilter]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/commissioner/trades");
      setTrades(response.data.trades);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  const filterTrades = () => {
    if (statusFilter === "all") {
      setFilteredTrades(trades);
    } else {
      setFilteredTrades(trades.filter(t => t.status === statusFilter));
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: "status-warning", label: "PENDING" },
      accepted: { bg: "status-ok", label: "ACCEPTED" },
      rejected: { bg: "status-error", label: "REJECTED" }
    };
    const { bg, label } = config[status] || config.pending;
    return (
      <Box background={bg} pad={{ horizontal: "small", vertical: "xxsmall" }} round="small">
        <Text size="xsmall" weight="bold" color="white">{label}</Text>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box fill align="center" justify="center">
        <Spinner size="large" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box fill align="center" justify="center" pad="large">
        <Text color="status-error">{error}</Text>
        <Button label="Retry" onClick={fetchTrades} margin={{ top: "medium" }} />
      </Box>
    );
  }

  const stats = {
    all: trades.length,
    pending: trades.filter(t => t.status === 'pending').length,
    accepted: trades.filter(t => t.status === 'accepted').length,
    rejected: trades.filter(t => t.status === 'rejected').length
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button icon={<Previous />} onClick={() => navigate("/commissioner")} plain />
          <h2 style={{ margin: 0 }}>Trade History</h2>
        </div>
        <Button icon={<Sync />} onClick={fetchTrades} tip="Refresh" />
      </div>

      <div style={{ padding: '24px' }}>
        {/* Filter Stats */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <div
            onClick={() => setStatusFilter("all")}
            style={{
              background: statusFilter === "all" ? '#7D4CDB' : 'white',
              color: statusFilter === "all" ? 'white' : '#333',
              padding: '16px',
              borderRadius: '8px',
              minWidth: '140px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '12px', opacity: 0.8 }}>All Trades</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.all}</div>
          </div>

          <div
            onClick={() => setStatusFilter("pending")}
            style={{
              background: statusFilter === "pending" ? '#FFAA15' : 'white',
              color: statusFilter === "pending" ? 'white' : '#333',
              padding: '16px',
              borderRadius: '8px',
              minWidth: '140px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Pending</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.pending}</div>
          </div>

          <div
            onClick={() => setStatusFilter("accepted")}
            style={{
              background: statusFilter === "accepted" ? '#00C781' : 'white',
              color: statusFilter === "accepted" ? 'white' : '#333',
              padding: '16px',
              borderRadius: '8px',
              minWidth: '140px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Accepted</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.accepted}</div>
          </div>

          <div
            onClick={() => setStatusFilter("rejected")}
            style={{
              background: statusFilter === "rejected" ? '#FF4040' : 'white',
              color: statusFilter === "rejected" ? 'white' : '#333',
              padding: '16px',
              borderRadius: '8px',
              minWidth: '140px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Rejected</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.rejected}</div>
          </div>
        </div>

        {/* Trades List */}
        {filteredTrades.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '48px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <Text color="dark-6">No {statusFilter !== 'all' ? statusFilter : ''} trades found</Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTrades.map(trade => (
              <div
                key={trade.id}
                onClick={() => setSelectedTrade(trade)}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{trade.fromTeam}</span>
                    <span style={{ color: '#999' }}>⇄</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{trade.toTeam}</span>
                  </div>
                  {getStatusBadge(trade.status)}
                </div>

                <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  {trade.summary}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #eee'
                }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>{trade.timeAgo}</span>
                  <span style={{ fontSize: '12px', color: '#7D4CDB', fontWeight: 'bold' }}>
                    Click for details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onReject={() => {}}
          isRejecting={false}
        />
      )}
    </div>
  );
};

export default TradesList;
