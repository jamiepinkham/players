// https://github.com/grommet/grommet/wiki/Grommet-v2-theming-documentation
// https://github.com/grommet/grommet/tree/NEXT/src/js/themes
export default {
  global: {
    font: {
      family: "Fira Sans"
    },
    colors: {
      // Primary brand color - Deep blue (baseball/sports inspired)
      brand: "#1D4ED8",
      // Accent color for highlights and active states
      accent: "#F97316",
      // Status colors - vibrant and clear
      "status-ok": "#10B981",
      "status-success": "#10B981",
      "status-warning": "#F59E0B",
      "status-error": "#EF4444",
      "status-critical": "#DC2626",
      "status-info": "#3B82F6",
      // Semantic colors
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
      info: "#3B82F6",
      // Light variants for backgrounds
      "light-1": "#F9FAFB",
      "light-2": "#F3F4F6",
      "light-3": "#E5E7EB",
      "light-4": "#D1D5DB",
      // Dark variants for headers/footers
      "dark-1": "#374151",
      "dark-2": "#1F2937",
      "dark-3": "#111827",
      "dark-4": "#6B7280",
      "dark-5": "#9CA3AF",
      // Background colors
      "background-contrast": "#FFFFFF",
      // Border colors
      border: "#D1D5DB",
      // Default text color (for light backgrounds)
      text: "#111827",
      // Text weak for de-emphasized text
      "text-weak": "#6B7280",
      "text-xweak": "#9CA3AF"
    },
    breakpoints: {
      xsmall: {
        value: 300
      },
      small: {
        value: 600
      },
      medium: {
        value: 900
      },
      middle: {
        value: 1200
      }
    },
    // Standardize spacing values
    edgeSize: {
      none: "0px",
      hair: "1px",
      xxsmall: "4px",
      xsmall: "8px",
      small: "16px",
      medium: "24px",
      large: "32px",
      xlarge: "48px"
    }
  },
  heading: {
    font: {
      family: "Fira Sans"
    }
  },
  textInput: {
    extend: `
      input {
        padding: 12px;
      }
    `
  },
  button: {
    primary: {
      color: "brand",
      font: {
        weight: 600
      }
    },
    border: {
      radius: "4px"
    },
    extend: props => `
      ${props.primary ? `
        color: white;
        & > * {
          color: white !important;
        }
      ` : ''}
    `
  },
  dataTable: {
    header: {
      background: "dark-1",
      color: "white",
      font: {
        weight: "bold"
      },
      extend: `
        color: white !important;
        & > * {
          color: white !important;
        }
      `
    },
    body: {
      extend: `
        tr:nth-child(odd) {
          background-color: white;
        }
        tr:nth-child(even) {
          background-color: #F9FAFB;
        }
      `
    }
  },
  tab: {
    active: {
      color: "white"
    },
    color: "white",
    border: {
      side: "bottom",
      size: "small",
      color: {
        dark: "brand",
        light: "brand"
      },
      active: {
        color: "white"
      }
    },
    margin: {
      horizontal: "none"
    },
    pad: {
      horizontal: "medium",
      vertical: "small"
    },
    extend: `
      color: white;
      & > button > div {
        gap: 8px;
      }
    `
  },
  tabs: {
    gap: "none",
    header: {
      background: "brand",
      extend: `
        justify-content: flex-start;
        border-radius: 4px 4px 0 0;
      `
    }
  }
};