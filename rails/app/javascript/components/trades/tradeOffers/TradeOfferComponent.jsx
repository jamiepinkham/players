import React, { useState } from "react";
import { useQuery, useMutation } from "graphql-hooks";
import { Anchor, Box, Text, Spinner, Header, Button, Accordion, AccordionPanel } from "grommet";
import ChooseTradePartner from "./ChooseTradePartner";
import TradeOffer from "./TradeOffer";
import { Next, Previous, InProgress } from 'grommet-icons';

const TEAMS_QUERY = `
  query TradingConsoleTeamQuery {
    teams {
      id
      name
      budget
    }
  }
`;

const CREATE_TRADE_MUTATION = `
mutation CreateTrade($input: CreateTradeMutationInput!) {
  createTrade(input:$input) {
    trade {
      id
    }
  }
}`;

const TradeStep = {
  pickToTeam: 0,
  chooseToContracts: 1,
  setToCash: 2,
  chooseFromContracts: 3,
  setFromCash: 4,
  submit: 5,
};

import { useAuth } from "../../../hooks/use_auth";
import TeamContractList from "../TeamContractList";
import PendingTrades from "../PendingTrades";
import CurrencyInput from "../../CurrencyInput";

function TradeOfferComponent() {
  const [toContracts, setToContracts] = useState([]);
  const [fromContracts, setFromContracts] = useState([]);
  const [note, setNote] = useState("");
  const [toCash, setToCash] = useState(0);
  const [fromCash, setFromCash] = useState(0);
  const [team, setTeam] = useState(null);
  const teamId = useAuth().teamId;
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(TradeStep.pickToTeam);
  const [sendingTrade, setSendingTrade] = useState(false);

  const modifyToContracts = (contractId, checked) => {
    console.log(contractId)
    if (checked) {
      setToContracts(toContracts.concat([contractId]))
    } else {
      setToContracts(toContracts.filter(item => item !== contractId))
    }
  }
  const modifyFromContracts = (contractId, checked) => {
    console.log(contractId)
    if (checked) {
      setFromContracts(fromContracts.concat([contractId]))
    } else {
      setFromContracts(fromContracts.filter(item => item !== contractId))
    }
  }

  async function submitTrade() {
    let payload = {
      "toTeamId": team.id,
      "toContractIds": toContracts,
      "toCash": toCash,
      "fromTeamId": teamId,
      "fromContractIds": fromContracts,
      "fromCash": fromCash
    }
    console.log(payload);
    setSendingTrade(true);
    await createTradeMutation({ variables: { "input": payload } });
    setSendingTrade(false);
    location.reload();
  }

  const { 
    loading,
    error,
    data = { teams: null }, refetch: refetch } = useQuery(TEAMS_QUERY);
  const [createTradeMutation] = useMutation(CREATE_TRADE_MUTATION);
  if (!data.teams) return <Spinner size="medium" alignSelf="center" />;
  return (
    <Accordion multiple={true} activeIndex={activeIndex} onActive={(index) => setActiveIndex(index)}>
      <AccordionPanel label='Pending Trades' background='light-2'>
        <PendingTrades />
      </AccordionPanel>
      <AccordionPanel label='Propose New Trade' background='light-2'>
        
        <TradeOffer
          fromTeam={data.teams.filter((team) => team.id == teamId)[0]}
          fromContracts={fromContracts}
          fromCash={fromCash}
          toTeam={team}
          toContracts={toContracts}
          toCash={toCash}
        />
        { currentStep === TradeStep.pickToTeam && (
            <ChooseTradePartner 
              teams={data.teams.filter((team) => team.id != teamId)}
              setToContracts={setToContracts}
              setTeam={setTeam}
              setNextStep={() => setCurrentStep(TradeStep.chooseToContracts)}
            />
        )}
        { currentStep === TradeStep.chooseToContracts && (
          <Box>
            <Header>
              <Anchor
                icon={<Previous />}
                onClick={() => {
                  setCurrentStep(TradeStep.pickToTeam);
                  setTeam(null);
                  setToContracts([]);
                }}
              />
              <Box align="center">
                <Text>Choose players to recieve from {team.name}:</Text>
              </Box>
              <Anchor
                icon={<Next />}
                onClick={() => setCurrentStep(TradeStep.setToCash)}
              />
            </Header>
            <TeamContractList team={team} onContractChecked={modifyToContracts} selectedContracts={toContracts} /> 
          </Box>
        )}
        { currentStep === TradeStep.setToCash && (
          <Box>
            <Header>
              <Anchor
                icon={<Previous />}
                label="Previous"
                onClick={() => {
                  setCurrentStep(TradeStep.chooseToContracts);
                  setToCash(0);
                }}
              />
              <Box>
                <Text>Enter cash to receive from {team.name}:</Text>
              </Box>
              <Anchor
                icon={<Next />}
                label="Next"
                onClick={() => setCurrentStep(TradeStep.chooseFromContracts)}
              />
            </Header>
            <CurrencyInput
              value={toCash}
              placeholder="Cash"
              onChange={(change) => {
                setToCash(parseInt(change.target.value) || 0);
              }}
            />
          </Box>
        )}
        { currentStep === TradeStep.chooseFromContracts && ( 
          <Box>
            <Header>
              <Anchor
                icon={<Previous />}
                label="Previous"
                onClick={() => {
                  setCurrentStep(TradeStep.setToCash);
                  setFromContracts([]);
                }}
              />
             <Box>
              <Text>Choose players to send to {team.name}:</Text>
            </Box>
            <Anchor
              icon={<Next />}
              label="Next"
              onClick={() => setCurrentStep(TradeStep.setFromCash)}
            /> 
          </Header>
          <TeamContractList
                team={data.teams.find((team) => team.id == teamId)}
                onContractChecked={modifyFromContracts}
                selectedContracts={fromContracts}
              />
        </Box>
        )}
        { currentStep === TradeStep.setFromCash && (
          <Box>
            
            <Header>
              <Anchor
                icon={<Previous />}
                label="Previous"
                onClick={() => {
                  setCurrentStep(TradeStep.chooseFromContracts);
                  setFromCash(0);
                }}
              />
             
             <Box>
              <Text>Enter cash to send to {team.name}::</Text>
            </Box> 
            
            <Anchor
              icon={<Next />}
              label="Next"
              onClick={() => setCurrentStep(TradeStep.submit)}
            />
          </Header>
          <CurrencyInput
                value={fromCash}
                placeholder="Cash"
                onChange={(change) => {
                  setFromCash(parseInt(change.target.value) || 0);
                }}
              />
        </Box>
        )}
        { currentStep === TradeStep.submit && (
            <Box>
              <Header>
                <Anchor
                  icon={<Previous />}
                  label="Previous"
                  onClick={() => {
                    setCurrentStep(TradeStep.setFromCash);
                    setFromCash(0);
                  }}
                />  
                </Header>
                <Button primary label="Submit Trade Offer" onClick={submitTrade} disabled={ sendingTrade } icon={(sendingTrade && (<InProgress/>))} />
            </Box>
        )}
      </AccordionPanel>
    </Accordion>
  );
}

export default TradeOfferComponent;
