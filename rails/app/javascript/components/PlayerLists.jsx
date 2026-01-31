import React, { useState } from "react";
import { Box, Tab, Tabs, TextInput, Button } from "grommet";
import { Search, FormClose } from "grommet-icons";
import PositionPlayerList from "./PositionPlayerList";

export default function PlayerLists({ onPlayerSelected }) {
  const [index, setIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const onActive = (nextIndex) => setIndex(nextIndex);

  const positions = ["SP", "RP", "C", "1B", "2B", "3B", "SS", "OF"];

  return (
    <Box>
      <Box direction="row" justify="end" align="center" gap="small" margin={{ bottom: "small" }}>
        <TextInput
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          icon={<Search />}
        />
        {searchTerm && (
          <Button
            icon={<FormClose />}
            onClick={() => setSearchTerm("")}
            tip="Clear search"
          />
        )}
      </Box>
      <Tabs activeIndex={index} onActive={onActive}>
        {positions.map((position) => (
          <Tab title={position} key={position}>
            <Box pad="medium">
              <PositionPlayerList
                position={position}
                onPlayerSelected={onPlayerSelected}
                searchTerm={searchTerm}
              />
            </Box>
          </Tab>
        ))}
      </Tabs>
    </Box>
  );
}
