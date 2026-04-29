import React from 'react';
import { ResponsiveContext } from 'grommet';
import { isMobile } from '../utils/responsive';

/**
 * ResponsiveContainer - Conditionally renders mobile or desktop components
 * based on the current breakpoint
 *
 * @param {React.Component} mobileComponent - Component to render on mobile (xsmall/small)
 * @param {React.Component} desktopComponent - Component to render on desktop (medium+)
 * @param {React.Component} tabletComponent - Optional component to render on tablet (medium)
 *
 * @example
 * <ResponsiveContainer
 *   mobileComponent={<MobileNav />}
 *   desktopComponent={<DesktopNav />}
 * />
 */
const ResponsiveContainer = ({ mobileComponent, desktopComponent, tabletComponent }) => {
  return (
    <ResponsiveContext.Consumer>
      {(size) => {
        if (isMobile(size)) {
          return mobileComponent;
        }
        if (size === 'medium' && tabletComponent) {
          return tabletComponent;
        }
        return desktopComponent;
      }}
    </ResponsiveContext.Consumer>
  );
};

export default ResponsiveContainer;
