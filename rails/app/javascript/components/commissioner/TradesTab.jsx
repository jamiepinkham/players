import React, { useState, useEffect } from "react";
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
} from "grommet";
import TradeDetailModal from "./TradeDetailModal";

const TradesTab = ({ trades, setNotification, onTradeUpdate }) => {
  const [allTrades, setAllTrades] = useState([]);
  const [loadingAllTrades, setLoadingAllTrades] = useState(false);
  const [tradesStatusFilter, setTradesStatusFilter] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [updatingTrades, setUpdatingTrades] = useState(new Set());
  const [loadingTradeDetails, setLoadingTradeDetails] = useState(false);

  useEffect(() => {
    fetchAllTrades();
  }, []);

  const fetchAllTrades = async () => {
    setLoadingAllTrades(true);
    try {
      const response = await axios.get("/api/commissioner/trades");
      setAllTrades(response.data.trades);
    } catch (err) {
      setNotification({
        message: 'Failed to load trades',
        type: 'error'
      });
    } finally {
      setLoadingAllTrades(false);
    }
  };

  const fetchTradeDetails = async (tradeId) => {
    setLoadingTradeDetails(true);
    try {
      const response = await axios.get("/api/commissioner/trades/pending");
      const trade = response.data.trades.find(t => t.id === tradeId);
      if (trade) {
        setSelectedTrade(trade);
      } else {
        setNotification({
          message: 'Trade not found',
          type: 'error'
        });
      }
    } catch (err) {
      setNotification({
        message: 'Failed to load trade details',
        type: 'error'
      });
    } finally {
      setLoadingTradeDetails(false);
    }
  };

  const rejectTrade = async (tradeId) => {
    setUpdatingTrades(prev => new Set(prev).add(tradeId));
    try {
      const response = await axios.post(`/api/commissioner/trades/${tradeId}/reject`);
      if (response.data.success) {
        setNotification({ message: 'Trade rejected successfully', type: 'success' });
        setSelectedTrade(null);
        await fetchAllTrades();
        if (onTradeUpdate) onTradeUpdate();
      }
    } catch (err) {
      console.error('Reject trade error:', err.response?.status, err.response?.data);
      setNotification({
        message: err.response?.data?.error || 'Failed to reject trade',
        type: 'error'
      });
    } finally {
      setUpdatingTrades(prev => {
        const next = new Set(prev);
        next.delete(tradeId);
        return next;
      });
    }
  };

  return (
    <>
      <Heading level={2} margin={{ bottom: "medium" }}>🤝 Trades</Heading>

      {/* Pending Trades Requiring Action */}
      {trades?.pending && trades.pending.length > 0 && (
        <Card background="light-1" margin={{ bottom: "medium" }}>
          <CardHeader pad="medium" background="status-warning">
            <Heading level={3} margin="none" color="white">
              ⚠️ Pending Trades ({trades.pending.length})
            </Heading>
          </CardHeader>
          <CardBody pad="medium">
            <Box gap="small">
              {trades.pending.map((trade) => (
                <Box
                  key={trade.id}
                  pad="small"
                  background="white"
                  round="small"
                  border
                >
                  <Box direction="row" justify="between">
                    <Text weight="bold">
                      {trade.fromTeam} → {trade.toTeam}
                    </Text>
                    <Text size="small" color="dark-6">
                      {trade.timeAgo}
                    </Text>
                  </Box>
                  <Text size="small">{trade.summary}</Text>
                  <Box direction="row" gap="small" margin={{ top: "small" }}>
                    <Button
                      label="View Details"
                      size="small"
                      onClick={() => fetchTradeDetails(trade.id)}
                      primary
                      disabled={loadingTradeDetails}
                      icon={loadingTradeDetails ? <Spinner size="small" /> : undefined}
                    />
                    <Button
                      label="Reject"
                      size="small"
                      color="status-error"
                      onClick={() => rejectTrade(trade.id)}
                      disabled={updatingTrades.has(trade.id)}
                      icon={updatingTrades.has(trade.id) ? <Spinner /> : undefined}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardBody>
        </Card>
      )}

      {/* All Trades */}
      <Card background="white">
        <CardHeader pad="medium" background="brand">
          <Box direction="row" justify="between" align="center">
            <Heading level={3} margin="none" color="white">
              Trade History
            </Heading>
            <Box direction="row" gap="small" align="center">
              <Button
                label={`All (${allTrades.length})`}
                size="small"
                primary={tradesStatusFilter === 'all'}
                onClick={() => setTradesStatusFilter('all')}
                style={{ background: tradesStatusFilter === 'all' ? 'white' : 'transparent', color: tradesStatusFilter === 'all' ? '#7D4CDB' : 'white' }}
              />
              <Button
                label={`Pending (${allTrades.filter(t => t.status === 'pending').length})`}
                size="small"
                primary={tradesStatusFilter === 'pending'}
                onClick={() => setTradesStatusFilter('pending')}
                style={{ background: tradesStatusFilter === 'pending' ? 'white' : 'transparent', color: tradesStatusFilter === 'pending' ? '#7D4CDB' : 'white' }}
              />
              <Button
                label={`Accepted (${allTrades.filter(t => t.status === 'accepted').length})`}
                size="small"
                primary={tradesStatusFilter === 'accepted'}
                onClick={() => setTradesStatusFilter('accepted')}
                style={{ background: tradesStatusFilter === 'accepted' ? 'white' : 'transparent', color: tradesStatusFilter === 'accepted' ? '#7D4CDB' : 'white' }}
              />
              <Button
                label={`Rejected (${allTrades.filter(t => t.status === 'rejected').length})`}
                size="small"
                primary={tradesStatusFilter === 'rejected'}
                onClick={() => setTradesStatusFilter('rejected')}
                style={{ background: tradesStatusFilter === 'rejected' ? 'white' : 'transparent', color: tradesStatusFilter === 'rejected' ? '#7D4CDB' : 'white' }}
              />
            </Box>
          </Box>
        </CardHeader>
        <CardBody pad="medium">
          {loadingAllTrades ? (
            <Box align="center" pad="large">
              <Spinner size="large" />
            </Box>
          ) : (
            <Box gap="small">
              {allTrades
                .filter(t => tradesStatusFilter === 'all' || t.status === tradesStatusFilter)
                .map(trade => (
                  <Box
                    key={trade.id}
                    pad="small"
                    background="light-1"
                    round="small"
                    border
                    onClick={() => setSelectedTrade(trade)}
                    style={{ cursor: 'pointer' }}
                    hoverIndicator
                  >
                    <Box direction="row" justify="between" align="center">
                      <Box>
                        <Text weight="bold">{trade.fromTeam} ⇄ {trade.toTeam}</Text>
                        <Text size="small" color="dark-6">{trade.summary}</Text>
                      </Box>
                      <Box direction="row" gap="small" align="center">
                        <Box
                          background={
                            trade.status === 'pending' ? 'status-warning' :
                            trade.status === 'accepted' ? 'status-ok' :
                            'status-error'
                          }
                          pad={{ horizontal: 'small', vertical: 'xxsmall' }}
                          round="small"
                        >
                          <Text size="xsmall" weight="bold" color="white">
                            {trade.status.toUpperCase()}
                          </Text>
                        </Box>
                        <Text size="small" color="dark-6">{trade.timeAgo}</Text>
                      </Box>
                    </Box>
                  </Box>
                ))}
            </Box>
          )}
        </CardBody>
      </Card>

      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onReject={rejectTrade}
          isRejecting={updatingTrades.has(selectedTrade.id)}
        />
      )}
    </>
  );
};

export default TradesTab;
