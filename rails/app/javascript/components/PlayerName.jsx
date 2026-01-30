import React, { useState, useRef } from "react";
import { Text, Tip, Anchor, Box } from "grommet";
import { Launch } from "grommet-icons";

/**
 * PlayerName component with Baseball Reference hover tooltip
 * Shows a tooltip on hover with link to player's Baseball Reference page
 *
 * @param {string} name - Player's name
 * @param {string} bbrefid - Baseball Reference ID (e.g., "troutmi01")
 * @param {boolean} bold - Whether to bold the name (default: false)
 */
const PlayerName = ({ name, bbrefid, bold = false }) => {
  const [showTip, setShowTip] = useState(false);
  const targetRef = useRef();

  // If no bbrefid, just show the name
  if (!bbrefid) {
    return <Text weight={bold ? "bold" : "normal"}>{name}</Text>;
  }

  // Build Baseball Reference URL
  // Format: https://www.baseball-reference.com/players/{first_letter}/{bbrefid}.shtml
  const firstLetter = bbrefid.charAt(0).toLowerCase();
  const bbrefUrl = `https://www.baseball-reference.com/players/${firstLetter}/${bbrefid}.shtml`;

  return (
    <>
      <Anchor
        ref={targetRef}
        href={bbrefUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        style={{ textDecoration: "none" }}
      >
        <Text weight={bold ? "bold" : "normal"} color="brand">
          {name}
        </Text>
      </Anchor>
      {showTip && targetRef.current && (
        <Tip
          content={
            <Box
              pad="xsmall"
              gap="xxsmall"
              direction="row"
              align="center"
            >
              <Launch size="small" />
              <Text size="small">View on Baseball Reference</Text>
            </Box>
          }
          plain
          dropProps={{ align: { bottom: "top" } }}
        >
          {targetRef.current}
        </Tip>
      )}
    </>
  );
};

export default PlayerName;
