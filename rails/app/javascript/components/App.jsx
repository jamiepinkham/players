import React, { useCallback, useEffect } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use_auth";
import { getAuthToken, validateToken } from "../utils/auth";
import axios from "axios";
import { useQuery } from "graphql-hooks";

import PrivateRoute from "./PrivateRoute";
import TeamsList from "./TeamsList";
import Profile from "./Profile";
import Bidding from "./Bidding";
import PlaceBid from "./PlaceBid";
import SessionLogin from "./SessionLogin";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ChangePassword from "./ChangePassword";
import TeamComponent from "./TeamComponent";
import TradeOfferComponent from "./trades/tradeOffers/TradeOfferComponent";
import CompletedTrades from "./trades/CompletedTrades";
import AllPlayersListSearch from "./AllPlayersListSearch";

import { Box, Header, Heading, Nav, Anchor, Main, ResponsiveContext } from "grommet";

import {
  Currency,
  List,
  Sync,
  UserSettings,
  UserAdmin,
  Search,
  History
} from "grommet-icons";

import MobileNav from "./MobileNav";
import { isMobile } from "../utils/responsive";

const NOTIFICATIONS_QUERY = `
  query NotificationsQuery($teamId: ID!) {
    trades(team: $teamId) {
      id
    }
    currentSeason {
      activeFreeAgencyPeriod {
        bids(teamId: $teamId, active: true) {
          id
        }
      }
    }
  }
`;


export default function App(props) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Query for pending trades and active bids to show notification dots
  // Poll every 10 seconds to keep dots updated
  const { data: notificationsData, refetch: refetchNotifications } = useQuery(NOTIFICATIONS_QUERY, {
    variables: { teamId: auth.teamId },
    skip: !auth.teamId || !auth.isSignedIn,
    skipCache: true,
  });

  // Poll every 30 seconds to catch any missed updates
  useEffect(() => {
    if (auth.teamId && auth.isSignedIn && refetchNotifications) {
      const interval = setInterval(() => {
        refetchNotifications();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [auth.teamId, auth.isSignedIn, refetchNotifications]);

  // Refetch notifications when navigating to update immediately
  useEffect(() => {
    if (auth.teamId && auth.isSignedIn && refetchNotifications) {
      refetchNotifications();
    }
  }, [location.pathname, auth.teamId, auth.isSignedIn, refetchNotifications]);

  // Listen for trade/bid updates and refetch immediately
  useEffect(() => {
    const handleTradeUpdate = () => {
      if (refetchNotifications) {
        refetchNotifications();
      }
    };

    window.addEventListener('tradeUpdated', handleTradeUpdate);
    window.addEventListener('bidPlaced', handleTradeUpdate);

    return () => {
      window.removeEventListener('tradeUpdated', handleTradeUpdate);
      window.removeEventListener('bidPlaced', handleTradeUpdate);
    };
  }, [refetchNotifications]);

  const hasPendingTrades = notificationsData?.trades?.length > 0;
  const hasActiveBids = notificationsData?.currentSeason?.activeFreeAgencyPeriod?.bids?.length > 0;

  const handleOnClick = useCallback(
    (page) => {
      navigate(`/${page}`);
    },
    [navigate]
  );

  const handleAdminClick = useCallback(async () => {
    // Get fresh token from localStorage
    const token = getAuthToken();

    if (!token) {
      alert('You must be logged in to access admin.');
      navigate('/sign_in');
      return;
    }

    // Validate token before navigating to admin
    const isValid = await validateToken(token);

    if (!isValid) {
      alert('Your session has expired. Please log in again.');
      navigate('/sign_in');
      return;
    }

    // Navigate to admin_login endpoint which will handle session creation and redirect
    window.location.href = `/admin_login?token=${token}`;
  }, [navigate]);
  return (
    <ResponsiveContext.Consumer>
      {(size) => (
        <Box>
          <Header
            background="brand"
            pad={{ horizontal: isMobile(size) ? "small" : "medium", vertical: "xsmall" }}
            round={{ corner: "bottom", size: "small" }}
            elevation="small"
          >
            <Heading level="2" color="white" margin="none">BMPL</Heading>
            {auth.isSignedIn && isMobile(size) && (
              <MobileNav
                handleOnClick={handleOnClick}
                handleAdminClick={handleAdminClick}
                currentPath={location.pathname}
                isAdmin={auth.isAdmin}
                hasPendingTrades={hasPendingTrades}
                hasActiveBids={hasActiveBids}
              />
            )}
            {auth.isSignedIn && !isMobile(size) && (
              <Nav direction="row" pad={{ horizontal: "small", vertical: "none" }}>
            <Box
              border={location.pathname.startsWith("/team") ? { side: "bottom", color: "white", size: "small" } : undefined}
            >
              <Anchor
                icon={<List />}
                hoverIndicator
                label="Teams"
                color="white"
                onClick={() => handleOnClick("teams")}
              />
            </Box>
            <Box
              border={location.pathname === "/bidding" ? { side: "bottom", color: "white", size: "small" } : undefined}
            >
              <Anchor
                icon={
                  <Box style={{ position: 'relative' }}>
                    <Currency />
                    {hasActiveBids && (
                      <Box
                        background="status-error"
                        round="full"
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '8px',
                          height: '8px',
                        }}
                      />
                    )}
                  </Box>
                }
                hoverIndicator
                label="Bidding"
                color="white"
                onClick={() => handleOnClick("bidding")}
              />
            </Box>
            <Box
              border={location.pathname === "/trade" ? { side: "bottom", color: "white", size: "small" } : undefined}
            >
              <Anchor
                icon={
                  <Box style={{ position: 'relative' }}>
                    <Sync />
                    {hasPendingTrades && (
                      <Box
                        background="status-error"
                        round="full"
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '8px',
                          height: '8px',
                        }}
                      />
                    )}
                  </Box>
                }
                hoverIndicator
                label="Trade"
                color="white"
                onClick={() => handleOnClick("trade")}
              />
            </Box>
            <Box
              border={location.pathname === "/trades" ? { side: "bottom", color: "white", size: "small" } : undefined}
            >
              <Anchor
                icon={<History />}
                hoverIndicator
                label="All Trades"
                color="white"
                onClick={() => handleOnClick("trades")}
              />
            </Box>
            <Box
              border={location.pathname === "/player_search" ? { side: "bottom", color: "white", size: "small" } : undefined}
            >
              <Anchor
                hoverIndicator
                icon={<Search />}
                label="Player Search"
                color="white"
                onClick={() => handleOnClick("player_search")}
              />
            </Box>
            <Box
              border={location.pathname === "/profile" ? { side: "bottom", color: "white", size: "small" } : undefined}
            >
              <Anchor
                icon={<UserSettings />}
                hoverIndicator
                label="Settings"
                color="white"
                onClick={() => handleOnClick("profile")}
              />
            </Box>
            {auth.isAdmin && (
              <Anchor
                icon={<UserAdmin />}
                hoverIndicator
                label="Admin"
                color="white"
                onClick={handleAdminClick}
              />
            )}
              </Nav>
            )}
          </Header>
          <Box margin={isMobile(size) ? "xsmall" : "small"}>
            <Main pad={isMobile(size) ? "xsmall" : "small"} fill="horizontal">
          <Routes>
            <Route path="/" element={<SessionLogin />} />
            <Route path="/sign_in" element={<SessionLogin />} />
            <Route path="/forgot" element={<ForgotPasswordForm />} />
            <Route path="/reset/:token" element={<ChangePassword />} />
            <Route path="/player_search" element={<PrivateRoute><AllPlayersListSearch /></PrivateRoute>} />
            <Route path="/teams" element={<PrivateRoute><TeamsList /></PrivateRoute>} />
            <Route path="/team/:id" element={<PrivateRoute><TeamComponent /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/bidding" element={<PrivateRoute><Bidding /></PrivateRoute>} />
            <Route path="/bidding/:playerId/place-bid" element={<PrivateRoute><PlaceBid /></PrivateRoute>} />
            <Route path="/trade" element={<PrivateRoute><TradeOfferComponent /></PrivateRoute>} />
            <Route path="/trades" element={<PrivateRoute><CompletedTrades /></PrivateRoute>} />
            <Route path="*" element={<NoMatch />} />
          </Routes>
            </Main>
          </Box>
        </Box>
      )}
    </ResponsiveContext.Consumer>
  );
}

function NoMatch() {
  let location = useLocation();

  return (
    <div>
      <h3>
        No match for <code>{location.pathname}</code>
      </h3>
    </div>
  );
}
