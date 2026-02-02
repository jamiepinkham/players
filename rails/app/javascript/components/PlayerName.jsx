import React from "react";
import { Text, Tip, Anchor, Box } from "grommet";
import { Link } from "grommet-icons";

/**
 * PlayerName component with Baseball Reference icon link
 * Shows player name with an icon that links to Baseball Reference
 *
 * @param {string} name - Player's name
 * @param {string} bbrefid - Baseball Reference ID (e.g., "troutmi01")
 * @param {boolean} bold - Whether to bold the name (default: false)
 * @param {string} size - Text size (default: undefined, uses Grommet default)
 */
const PlayerName = ({ name, bbrefid, bold = false, size }) => {
  // If no bbrefid, just show the name
  if (!bbrefid || bbrefid.trim() === '') {
    return <Text weight={bold ? "bold" : "normal"} size={size}>{name}</Text>;
  }

  // Build Baseball Reference URL
  // Format: https://www.baseball-reference.com/players/{first_letter}/{bbrefid}.shtml
  const firstLetter = bbrefid.charAt(0).toLowerCase();
  const bbrefUrl = `https://www.baseball-reference.com/players/${firstLetter}/${bbrefid}.shtml`;

  return (
    <Box direction="row" align="center" gap="xsmall">
      <Text weight={bold ? "bold" : "normal"} size={size}>{name}</Text>
      <Anchor
        href={bbrefUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View on Baseball Reference"
      >
        <img
          src="https://www.baseball-reference.com/favicon.ico"
          alt="Baseball Reference"
          style={{ width: '16px', height: '16px' }}
        />
      </Anchor>
    </Box>
  );
};

export default PlayerName;
