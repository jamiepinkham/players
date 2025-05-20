import React, { useState } from "react";
import { Box, Tab, Tabs } from "grommet";
import PositionPlayerList from "./PositionPlayerList";

export default function PlayerLists({ onPlayerSelected }) {
  const [index, setIndex] = useState(null);
  const onActive = (nextIndex) => setIndex(nextIndex);

  const positions = ["SP", "RP", "C", "1B", "2B", "3B", "SS", "OF"];

  return (
    <Tabs activeIndex={index} onActive={onActive}>
      {positions.map((position) => (
        <Tab title={position} key={position}>
          <Box pad="medium">
            <PositionPlayerList
              position={position}
              onPlayerSelected={onPlayerSelected}
            />
          </Box>
        </Tab>
      ))}
    </Tabs>
  );
}
