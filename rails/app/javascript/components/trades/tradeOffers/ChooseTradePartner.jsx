import React from "react";
import { Select } from "grommet";


export default function ChooseTradePartner({teams, setToContracts, setTeam, setNextStep}) {
    return (
        <Select
            options={teams}
            labelKey="name"
            valueKey="id"
            placeholder="Select Team"
            onChange={({ option }) => {
                setToContracts([]);
                setTeam(option);
                setNextStep();
            }}
      />
    )
}