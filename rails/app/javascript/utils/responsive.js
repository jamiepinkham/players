import { useContext } from 'react';
import { ResponsiveContext } from 'grommet';

// Breakpoint constants matching site-theme.jsx
export const BREAKPOINTS = {
  XSMALL: 'xsmall',
  SMALL: 'small',
  MEDIUM: 'medium',
  MIDDLE: 'middle',
  LARGE: 'large',
};

// Breakpoint size values (in pixels)
export const BREAKPOINT_VALUES = {
  xsmall: 300,
  small: 600,
  medium: 900,
  middle: 1200,
};

/**
 * Hook to get the current breakpoint size from Grommet's ResponsiveContext
 * @returns {string} Current breakpoint size (xsmall, small, medium, middle, large)
 */
export const useBreakpoint = () => {
  const size = useContext(ResponsiveContext);
  return size;
};

/**
 * Check if current breakpoint is mobile size (xsmall or small)
 * @param {string} size - Current breakpoint size from ResponsiveContext
 * @returns {boolean} True if mobile size
 */
export const isMobile = (size) => {
  return [BREAKPOINTS.XSMALL, BREAKPOINTS.SMALL].includes(size);
};

/**
 * Check if current breakpoint is tablet size (medium)
 * @param {string} size - Current breakpoint size from ResponsiveContext
 * @returns {boolean} True if tablet size
 */
export const isTablet = (size) => {
  return size === BREAKPOINTS.MEDIUM;
};

/**
 * Check if current breakpoint is desktop size (middle or larger)
 * @param {string} size - Current breakpoint size from ResponsiveContext
 * @returns {boolean} True if desktop size
 */
export const isDesktop = (size) => {
  return [BREAKPOINTS.MIDDLE, BREAKPOINTS.LARGE].includes(size);
};

/**
 * Get responsive value based on current breakpoint
 * @param {string} size - Current breakpoint size from ResponsiveContext
 * @param {object} values - Object with breakpoint keys and values
 * @param {*} values.mobile - Value for mobile breakpoints
 * @param {*} values.tablet - Value for tablet breakpoint (optional)
 * @param {*} values.desktop - Value for desktop breakpoints
 * @returns {*} Value for current breakpoint
 *
 * @example
 * const padding = getResponsiveValue(size, {
 *   mobile: 'small',
 *   desktop: 'medium'
 * });
 */
export const getResponsiveValue = (size, values) => {
  if (isMobile(size)) {
    return values.mobile;
  }
  if (isTablet(size) && values.tablet !== undefined) {
    return values.tablet;
  }
  if (isTablet(size) || isDesktop(size)) {
    return values.desktop || values.mobile;
  }
  return values.desktop || values.mobile;
};
