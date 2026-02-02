import React, { useState } from 'react';
import { Box, Layer, Button, Nav, Anchor } from 'grommet';
import { Menu, Close, List, Currency, Sync, History, Search, UserSettings, UserAdmin } from 'grommet-icons';

/**
 * MobileNav - Mobile navigation component with hamburger menu
 * Displays a hamburger icon that opens a slide-out drawer with navigation items
 *
 * @param {Function} handleOnClick - Navigation click handler
 * @param {Function} handleAdminClick - Admin link click handler
 * @param {string} currentPath - Current route pathname
 * @param {boolean} isAdmin - Whether user has admin privileges
 * @param {boolean} hasPendingTrades - Whether there are pending trades (for notification dot)
 * @param {boolean} hasActiveBids - Whether there are active bids (for notification dot)
 */
const MobileNav = ({
  handleOnClick,
  handleAdminClick,
  currentPath,
  isAdmin,
  hasPendingTrades,
  hasActiveBids
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => setShowMenu(!showMenu);

  const handleNavClick = (page) => {
    handleOnClick(page);
    setShowMenu(false);
  };

  const handleAdminNavClick = () => {
    handleAdminClick();
    setShowMenu(false);
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

  return (
    <>
      {/* Hamburger Icon */}
      <Button
        icon={<Menu color="white" />}
        onClick={toggleMenu}
        plain
        hoverIndicator
      />

      {/* Slide-out Drawer */}
      {showMenu && (
        <Layer
          position="right"
          full="vertical"
          modal
          onClickOutside={toggleMenu}
          onEsc={toggleMenu}
        >
          <Box
            fill="vertical"
            width="medium"
            background="brand"
            pad="medium"
            gap="small"
          >
            {/* Close Button */}
            <Box direction="row" justify="end">
              <Button
                icon={<Close color="white" />}
                onClick={toggleMenu}
                plain
                hoverIndicator
              />
            </Box>

            {/* Navigation Items */}
            <Nav gap="small">
              <Box
                pad="small"
                background={currentPath.startsWith("/team") ? { color: "white", opacity: 0.2 } : undefined}
                round="xsmall"
              >
                <Anchor
                  icon={<List />}
                  label="Teams"
                  color="white"
                  onClick={() => handleNavClick("teams")}
                />
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
            </Nav>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default MobileNav;
