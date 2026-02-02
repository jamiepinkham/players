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

import { Box, Header, Heading, Main, ResponsiveContext } from "grommet";

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
    <Box>
      <Header
        background="brand"
        pad={{ horizontal: "medium", vertical: "xsmall" }}
        round={{ corner: "bottom", size: "small" }}
        elevation="small"
      >
        <Heading level="2" color="white" margin="none">BMPL</Heading>
        {auth.isSignedIn && (
          <MobileNav
            handleOnClick={handleOnClick}
            handleAdminClick={handleAdminClick}
            currentPath={location.pathname}
            isAdmin={auth.isAdmin}
            hasPendingTrades={hasPendingTrades}
            hasActiveBids={hasActiveBids}
          />
        )}
      </Header>
      <ResponsiveContext.Consumer>
        {(size) => (
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
        )}
      </ResponsiveContext.Consumer>
    </Box>
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
