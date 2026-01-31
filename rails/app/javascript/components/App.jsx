import React, { useCallback } from "react";
import { Route, Switch, useHistory, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use_auth";
import { getAuthToken, validateToken } from "../utils/auth";
import axios from "axios";

import PrivateRoute from "./PrivateRoute";
import TeamsList from "./TeamsList";
import Profile from "./Profile";
import Bidding from "./Bidding";
import SessionLogin from "./SessionLogin";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ChangePassword from "./ChangePassword";
import TeamComponent from "./TeamComponent";
import TradeOfferComponent from "./trades/tradeOffers/TradeOfferComponent";
import CompletedTrades from "./trades/CompletedTrades";
import AllPlayersListSearch from "./AllPlayersListSearch";

import { Box, Header, Heading, Nav, Anchor, Main } from "grommet";

import {
  Currency,
  List,
  Sync,
  UserSettings,
  UserAdmin,
  Search,
  History
} from "grommet-icons";


export default function App(props) {
  const auth = useAuth();
  const history = useHistory();
  const location = useLocation();
  const handleOnClick = useCallback(
    (page) => {
      history.push(`/${page}`);
    },
    [history]
  );

  const handleAdminClick = useCallback(async () => {
    // Get fresh token from localStorage
    const token = getAuthToken();

    if (!token) {
      alert('You must be logged in to access admin.');
      history.push('/sign_in');
      return;
    }

    // Validate token before navigating to admin
    const isValid = await validateToken(token);

    if (!isValid) {
      alert('Your session has expired. Please log in again.');
      history.push('/sign_in');
      return;
    }

    // Navigate to admin_login endpoint which will handle session creation and redirect
    window.location.href = `/admin_login?token=${token}`;
  }, [history]);
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
                icon={<Currency />}
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
                icon={<Sync />}
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
      <Box margin="small">
        <Main pad="small" fill="horizontal">
          <Switch>
            <Route exact path="/" component={SessionLogin} />
            <Route exact path="/sign_in" component={SessionLogin} />
            <Route exact path="/forgot" component={ForgotPasswordForm} />
            <Route path="/reset/:token" component={ChangePassword} />
            <PrivateRoute path="/player_search" component={AllPlayersListSearch} />
            <PrivateRoute exact path="/teams" component={TeamsList} />
            <PrivateRoute exact path="/team/:id" component={TeamComponent} />
            <PrivateRoute exact path="/profile" component={Profile} />
            <PrivateRoute exact path="/bidding" component={Bidding} />
            <PrivateRoute exact path='/trade' component={TradeOfferComponent} />
            <PrivateRoute exact path="/trades" component={CompletedTrades} />
            <Route path="*">
              <NoMatch />
            </Route>
          </Switch>
        </Main>
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
