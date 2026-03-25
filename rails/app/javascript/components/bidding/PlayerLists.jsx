import React, { useState, useEffect } from "react";
import { Box, Tab, Tabs, Text } from "grommet";
import { User } from "grommet-icons";
import PositionPlayerList from "./PositionPlayerList";
import EmptyState from "../common/EmptyState";

export default function PlayerLists({ onPlayerSelected, teamId }) {
  const positions = ["SP", "RP", "C", "1B", "2B", "3B", "SS", "OF", "DH"];

  // Initialize index from localStorage or default to null
  const [index, setIndex] = useState(() => {
    const saved = localStorage.getItem('biddingPositionIndex');
    return saved ? parseInt(saved, 10) : null;
  });

  const onActive = (nextIndex) => {
    setIndex(nextIndex);
    localStorage.setItem('biddingPositionIndex', nextIndex.toString());
  };

  return (
    <Box>
      <Box
        direction="row"
        background="#666666"
        round="small"
        overflow="hidden"
      >
        {positions.map((position, idx) => (
          <Box
            key={position}
            flex="grow"
            background={index === idx ? "#555555" : "#666666"}
            hoverIndicator={{ background: "#555555" }}
            align="center"
            justify="center"
            pad={{ horizontal: "small", vertical: "xsmall" }}
            onClick={() => onActive(idx)}
            style={{
              cursor: 'pointer',
              borderRight: idx < positions.length - 1 ? '1px solid #444444' : 'none'
            }}
          >
            <Text color="white" weight={index === idx ? "bold" : "normal"} size="small">
              {position}
            </Text>
          </Box>
        ))}
      </Box>
      {index !== null ? (
        <Box pad="medium">
          <PositionPlayerList
            position={positions[index]}
            onPlayerSelected={onPlayerSelected}
            teamId={teamId}
          />
        </Box>
      ) : (
        <Box pad="large">
          <EmptyState
            icon={User}
            title="Select a position"
            message="Choose a position tab above to view available free agents"
          />
        </Box>
      )}
    </Box>
  );
}
