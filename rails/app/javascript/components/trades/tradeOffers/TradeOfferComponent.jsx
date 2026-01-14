import React, { useState } from "react";
import { useQuery } from "graphql-hooks";
import { Spinner, Accordion, AccordionPanel } from "grommet";
import { useAuth } from "../../../hooks/use_auth";
import PendingTrades from "../PendingTrades";
import SplitScreenTradeBuilder from "./SplitScreenTradeBuilder";

const TEAMS_QUERY = `
  query TradingConsoleTeamQuery {
    teams {
      id
      name
      budget
    }
  }
`;

function TradeOfferComponent() {
  const teamId = useAuth().teamId;
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    loading,
    error,
    data = { teams: null }
  } = useQuery(TEAMS_QUERY);

  if (!data.teams) return <Spinner size="medium" alignSelf="center" />;
  return (
    <Accordion multiple={true} activeIndex={activeIndex} onActive={(index) => setActiveIndex(index)}>
      <AccordionPanel label='Pending Trades' background='light-2'>
        <PendingTrades />
      </AccordionPanel>
      <AccordionPanel label='Propose New Trade' background='light-2'>
        <SplitScreenTradeBuilder
          teams={data.teams}
          currentTeamId={teamId}
          onTradeSubmitted={() => location.reload()}
        />
      </AccordionPanel>
    </Accordion>
  );
}

export default TradeOfferComponent;
