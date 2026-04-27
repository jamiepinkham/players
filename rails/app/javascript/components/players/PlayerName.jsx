import React from "react";
import { Text, Tip, Anchor, Box } from "grommet";
import { Link as LinkIcon } from "grommet-icons";
import { Link } from "react-router-dom";
import PlayerAvatar from "./PlayerAvatar";

/**
 * PlayerName component with Baseball Reference icon link
 * Shows player name with an icon that links to Baseball Reference
 *
 * @param {string} playerId - Player's database ID for linking to detail page
 * @param {string} name - Player's name
 * @param {string} bbrefid - Baseball Reference ID (e.g., "troutmi01")
 * @param {boolean} bold - Whether to bold the name (default: false)
 * @param {string} size - Text size (default: undefined, uses Grommet default)
 * @param {boolean} showAvatar - Whether to show player avatar (default: true)
 * @param {string} avatarSize - Size of avatar: small, medium, large (default: small)
 * @param {boolean} showBaseballRefLink - Whether to show Baseball Reference link (default: true)
 */
const PlayerName = ({ playerId, name, bbrefid, bold = false, size, showAvatar = true, avatarSize = "small", showBaseballRefLink = true }) => {
  // Build Baseball Reference URL
  const firstLetter = bbrefid?.charAt(0).toLowerCase();
  const bbrefUrl = bbrefid ? `https://www.baseball-reference.com/players/${firstLetter}/${bbrefid}.shtml` : null;

  const content = (
    <Box direction="row" align="center" gap="xsmall">
      {showAvatar && bbrefid && <PlayerAvatar bbrefid={bbrefid} size={avatarSize} name={name} />}
      <Text weight={bold ? "bold" : "normal"} size={size}>{name}</Text>
      {!bbrefid && (
        <Tip content="No Baseball Reference ID - stats unavailable">
          <Text size="small" color="status-warning" weight="bold">*</Text>
        </Tip>
      )}
      {showBaseballRefLink && bbrefUrl && (
        <Anchor
          href={bbrefUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Baseball Reference"
          onClick={(e) => e.stopPropagation()} // Prevent navigation to player page when clicking bbref link
        >
          <img
            src="https://www.baseball-reference.com/favicon.ico"
            alt="Baseball Reference"
            style={{ width: '16px', height: '16px' }}
          />
        </Anchor>
      )}
    </Box>
  );

  // If we have a playerId, make the whole thing a link to the player detail page
  if (playerId) {
    return (
      <Link to={`/player/${playerId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    );
  }

  return content;
};

export default PlayerName;
