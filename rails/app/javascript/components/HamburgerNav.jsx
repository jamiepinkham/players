import React, { useState } from 'react';
import { Box, Layer, Button, Nav, Anchor, Text } from 'grommet';
import { Menu, Close, List, Currency, Sync, History, Search, UserSettings, UserAdmin, FormDown, FormUp, Logout } from 'grommet-icons';
import { useQuery } from 'graphql-hooks';
import { useAuth } from '../hooks/use_auth';
import { useNavigate } from 'react-router-dom';

const TEAMS_QUERY = `
  query TeamsQuery {
    teams {
      id
      name
    }
  }
`;

/**
 * HamburgerNav - Navigation component with hamburger menu
 * Displays a hamburger icon that opens a slide-out drawer with navigation items
 *
 * @param {Function} handleOnClick - Navigation click handler
 * @param {Function} handleAdminClick - Admin link click handler
 * @param {string} currentPath - Current route pathname
 * @param {boolean} isAdmin - Whether user has admin privileges
 * @param {boolean} hasPendingTrades - Whether there are pending trades (for notification dot)
 * @param {boolean} hasActiveBids - Whether there are active bids (for notification dot)
 */
const HamburgerNav = ({
  handleOnClick,
  handleAdminClick,
  currentPath,
  isAdmin,
  hasPendingTrades,
  hasActiveBids
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery(TEAMS_QUERY);
  const teams = data?.teams || [];

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    if (showMenu) {
      setShowTeamsDropdown(false);
    }
  };

  const handleNavClick = (page) => {
    handleOnClick(page);
    setShowMenu(false);
    setShowTeamsDropdown(false);
  };

  const handleAdminNavClick = () => {
    handleAdminClick();
    setShowMenu(false);
  };

  const handleSignOut = () => {
    auth.signOut().then(() => {
      setShowMenu(false);
      navigate("/");
    });
  };

  // Notification dot component
  const NotificationDot = () => (
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
  );

  const hasNotifications = hasPendingTrades || hasActiveBids;

  return (
    <>
      {/* Hamburger Icon with Notification Dot */}
      <Button
        icon={
          <Box style={{ position: 'relative' }}>
            <Menu color="white" />
            {hasNotifications && (
              <Box
                background="status-error"
                round="full"
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '10px',
                  height: '10px',
                }}
              />
            )}
          </Box>
        }
        onClick={toggleMenu}
        plain
        hoverIndicator
      />

      {/* Slide-out Drawer */}
      {showMenu && (
        <Layer
          position="left"
          full="vertical"
          modal
          onClickOutside={toggleMenu}
          onEsc={toggleMenu}
        >
          <Box
            fill="vertical"
            width="medium"
            background="brand"
            overflow={{ vertical: 'auto' }}
          >
            {/* Close Button */}
            <Box direction="row" justify="start" pad="medium" flex={false}>
              <Button
                icon={<Close color="white" />}
                onClick={toggleMenu}
                plain
                hoverIndicator
              />
            </Box>

            {/* Navigation Items */}
            <Box pad={{ horizontal: "medium", bottom: "medium" }} overflow={{ vertical: 'auto' }}>
              <Nav gap="small">
                <Box>
                  <Box
                    pad="small"
                    background={currentPath.startsWith("/team") ? { color: "white", opacity: 0.2 } : undefined}
                    round="xsmall"
                    onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
                    hoverIndicator={{ color: "white", opacity: 0.1 }}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box direction="row" align="center" gap="small">
                      <List color="white" />
                      <Text color="white">Teams</Text>
                      {showTeamsDropdown ? <FormUp color="white" size="small" /> : <FormDown color="white" size="small" />}
                    </Box>
                  </Box>
                  {showTeamsDropdown && (
                    <Box
                      pad={{ left: "medium", top: "xsmall" }}
                      gap="xsmall"
                    >
                      <Box
                        pad="xsmall"
                        background={currentPath === "/teams" ? { color: "white", opacity: 0.2 } : undefined}
                        round="xsmall"
                        hoverIndicator={{ color: "white", opacity: 0.1 }}
                      >
                        <Anchor
                          label="All Teams"
                          color="white"
                          onClick={() => handleNavClick("teams")}
                        />
                      </Box>
                      {teams.map((team) => (
                        <Box
                          key={team.id}
                          pad="xsmall"
                          background={currentPath === `/team/${team.id}` ? { color: "white", opacity: 0.2 } : undefined}
                          round="xsmall"
                          hoverIndicator={{ color: "white", opacity: 0.1 }}
                        >
                          <Anchor
                            label={team.name}
                            color="white"
                            onClick={() => handleNavClick(`team/${team.id}`)}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

              <Box
                pad="small"
                background={currentPath === "/bidding" ? { color: "white", opacity: 0.2 } : undefined}
                round="xsmall"
              >
                <Anchor
                  icon={
                    <Box style={{ position: 'relative' }}>
                      <Currency />
                      {hasActiveBids && <NotificationDot />}
                    </Box>
                  }
                  label="Bidding"
                  color="white"
                  onClick={() => handleNavClick("bidding")}
                />
              </Box>

              <Box
                pad="small"
                background={currentPath === "/trade" ? { color: "white", opacity: 0.2 } : undefined}
                round="xsmall"
              >
                <Anchor
                  icon={
                    <Box style={{ position: 'relative' }}>
                      <Sync />
                      {hasPendingTrades && <NotificationDot />}
                    </Box>
                  }
                  label="Trade"
                  color="white"
                  onClick={() => handleNavClick("trade")}
                />
              </Box>

              <Box
                pad="small"
                background={currentPath === "/trades" ? { color: "white", opacity: 0.2 } : undefined}
                round="xsmall"
              >
                <Anchor
                  icon={<History />}
                  label="All Trades"
                  color="white"
                  onClick={() => handleNavClick("trades")}
                />
              </Box>

              <Box
                pad="small"
                background={currentPath === "/player_search" ? { color: "white", opacity: 0.2 } : undefined}
                round="xsmall"
              >
                <Anchor
                  icon={<Search />}
                  label="Player Search"
                  color="white"
                  onClick={() => handleNavClick("player_search")}
                />
              </Box>

              <Box
                pad="small"
                background={currentPath === "/profile" ? { color: "white", opacity: 0.2 } : undefined}
                round="xsmall"
              >
                <Anchor
                  icon={<UserSettings />}
                  label="Settings"
                  color="white"
                  onClick={() => handleNavClick("profile")}
                />
              </Box>

              {isAdmin && (
                <Box
                  pad="small"
                  round="xsmall"
                >
                  <Anchor
                    icon={<UserAdmin />}
                    label="Admin"
                    color="white"
                    onClick={handleAdminNavClick}
                  />
                </Box>
              )}

              <Box
                pad="small"
                round="xsmall"
              >
                <Anchor
                  icon={<Logout />}
                  label="Sign Out"
                  color="white"
                  onClick={handleSignOut}
                />
              </Box>
            </Nav>
            </Box>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default HamburgerNav;
