import React from "react";
import { Text, Tip, Anchor } from "grommet";
import { CircleInformation } from "grommet-icons";

/**
 * PlayerName component with Baseball Reference hover tooltip
 * Shows a tooltip on hover with link to player's Baseball Reference page
 *
 * @param {string} name - Player's name
 * @param {string} bbrefid - Baseball Reference ID (e.g., "troutmi01")
 * @param {boolean} bold - Whether to bold the name (default: false)
 */
const PlayerName = ({ name, bbrefid, bold = false }) => {
  // If no bbrefid, just show the name
  if (!bbrefid || bbrefid.trim() === '') {
    return <Text weight={bold ? "bold" : "normal"}>{name}</Text>;
  }

  // Build Baseball Reference URL
  // Format: https://www.baseball-reference.com/players/{first_letter}/{bbrefid}.shtml
  const firstLetter = bbrefid.charAt(0).toLowerCase();
  const bbrefUrl = `https://www.baseball-reference.com/players/${firstLetter}/${bbrefid}.shtml`;

  return (
    <Anchor
      href={bbrefUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="View on Baseball Reference"
    >
      <Text weight={bold ? "bold" : "normal"}>
        {name}
      </Text>
    </Anchor>
  );
};

export default PlayerName;
