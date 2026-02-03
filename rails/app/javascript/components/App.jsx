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

import { Box, Header, Heading, Main, ResponsiveContext, Text, Button } from "grommet";
import { Logout } from "grommet-icons";

import HamburgerNav from "./HamburgerNav";
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

const TEAM_NAME_QUERY = `
  query TeamNameQuery($id: ID!) {
    team(id: $id) {
      name
    }
  }
`;

const MY_TEAM_QUERY = `
  query MyTeamQuery($id: ID!) {
    team(id: $id) {
      name
    }
  }
`;


export default function App(props) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract team ID from URL if on team page
  const teamMatch = location.pathname.match(/^\/team\/(\d+)$/);
  const viewingTeamId = teamMatch ? teamMatch[1] : null;

  // Query for pending trades and active bids to show notification dots
  // Poll every 10 seconds to keep dots updated
  const { data: notificationsData, refetch: refetchNotifications } = useQuery(NOTIFICATIONS_QUERY, {
    variables: { teamId: auth.teamId },
    skip: !auth.teamId || !auth.isSignedIn,
    skipCache: true,
  });

  // Query for team name when viewing a team page
  const { data: teamData } = useQuery(TEAM_NAME_QUERY, {
    variables: { id: viewingTeamId },
    skip: !viewingTeamId,
  });

  // Query for current user's team name
  const { data: myTeamData } = useQuery(MY_TEAM_QUERY, {
    variables: { id: auth.teamId },
    skip: !auth.teamId,
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

  const handleSignOut = useCallback(() => {
    auth.signOut().then(() => {
      navigate("/");
    });
  }, [auth, navigate]);

  // Get page title based on current path
  const getPageTitle = () => {
    if (location.pathname === "/teams") return "Teams";
    if (location.pathname.startsWith("/team/")) return teamData?.team?.name || "Team";
    if (location.pathname === "/bidding") return myTeamData?.team?.name ? `${myTeamData.team.name} Bidding` : "Bidding";
    if (location.pathname.includes("/place-bid")) return "Place Bid";
    if (location.pathname === "/trade") return "Trade";
    if (location.pathname === "/trades") return "All Trades";
    if (location.pathname === "/player_search") return "Player Search";
    if (location.pathname === "/profile") return myTeamData?.team?.name ? `${myTeamData.team.name} Settings` : "Settings";
    return null;
  };

  const pageTitle = getPageTitle();

  return (
    <Box fill="vertical" direction="column">
      <Header
        background="brand"
        pad={{ horizontal: "medium", vertical: "xsmall" }}
        round={{ corner: "bottom", size: "small" }}
        elevation="small"
        flex={false}
        justify="between"
      >
        <Box direction="row" align="center" gap="small">
          {auth.isSignedIn && (
            <HamburgerNav
              handleOnClick={handleOnClick}
              handleAdminClick={handleAdminClick}
              currentPath={location.pathname}
              isAdmin={auth.isAdmin}
              hasPendingTrades={hasPendingTrades}
              hasActiveBids={hasActiveBids}
            />
          )}
          <Heading level="2" color="white" margin="none">BMPL</Heading>
          {pageTitle && (
            <>
              <Text color="white" size="large" weight="normal"> / </Text>
              <Text color="white" size="large">{pageTitle}</Text>
            </>
          )}
        </Box>
        {auth.isSignedIn && (
          <Button
            icon={<Logout color="white" />}
            label={<Text color="white">Sign Out</Text>}
            onClick={handleSignOut}
            plain
            hoverIndicator
          />
        )}
      </Header>
      <Box flex overflow={{ vertical: "auto" }} style={{ minHeight: 0 }}>
        <ResponsiveContext.Consumer>
          {(size) => {
            const isAuthPage = ["/", "/sign_in", "/forgot"].includes(location.pathname) || location.pathname.startsWith("/reset/");
            return (
              <Main pad={isAuthPage ? "none" : (isMobile(size) ? "small" : "medium")} fill>
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
            );
          }}
        </ResponsiveContext.Consumer>
      </Box>
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
