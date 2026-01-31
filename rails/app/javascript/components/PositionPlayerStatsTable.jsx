import React from "react";
import { Button, DataTable, Box } from "grommet";
import CurrencyFormat from "react-currency-format";
import LeadingBidComponent from "./LeadingBidComponent";
import PlayerName from "./PlayerName";
import { DATA_TABLE_THEME } from "../constants/ui";

export default function PositionPlayerStatsTable({
  players,
  position,
  onPlayerSelected,
  includeBidLink,
  includeLeadingBid
}) {
  let columns = [
    {
      property: "name",
      header: "Name",
      render: (player) => (
        <PlayerName name={player.name} bbrefid={player.bbrefid} />
      ),
    },
  ];

  if (includeBidLink) {
    columns.push({
      header: "Bid",
      render: (player) => (
        <Button onClick={(e) => onPlayerSelected(player)}>Bid</Button>
      ),
    });
  }

  if (includeLeadingBid) {
      columns.push({
          header: "Leading Bid",
          render: (player) => (
              <LeadingBidComponent player={player} />
          )
      })
  }

  players = players.filter((player) => player.stats.length > 0);

  if (position === "SP" || position === "RP") {
    columns.push({ header: "IP", property: "innings_pitched" });
    columns.push({ header: "ERA", property: "era" });
    columns.push({ header: "W", property: "wins" });
    columns.push({ header: "L", property: "losses" });
    columns.push({ header: "SV", property: "saves" });
    columns.push({ header: "G", property: "games" });
    columns.push({ header: 'GS', property: "games_started" });
    columns.push({ header: "K/9", property: "strikeout_per_nine" });
    columns.push({ header: "BB/9", property: "walk_per_nine" });
    columns.push({ header: "HR/9", property: "homeruns_per_nine" });
    columns.push({ header: "WAR", property: "war"})

    players.forEach((player) => {
      player.innings_pitched = parseInt(
        player.stats.filter((stat) => stat.title == "IP")[0]?.value,
        10
      );
      player.era = parseFloat(
        player.stats.filter((stat) => stat.title == "ERA")[0]?.value
      );
      player.wins = parseInt(
        player.stats.filter((stat) => stat.title == "W")[0]?.value,
        10
      );
      player.losses = parseInt(
        player.stats.filter((stat) => stat.title == "L")[0]?.value,
        10
      );
      player.saves = parseInt(
        player.stats.filter((stat) => stat.title == "SV")[0]?.value,
        10
      );
      player.games = parseInt(
        player.stats.filter((stat) => stat.title == "G")[0]?.value,
        10
      );
      player.games_started = parseInt(player.stats.filter(stat => stat.title == 'GS')[0]?.value, 10);
      player.strikeout_per_nine = parseFloat(
        player.stats.filter((stat) => stat.title == "SO9")[0]
          ?.value
      );
      player.walk_per_nine = parseFloat(
        player.stats.filter(
          (stat) => stat.title == "BB9")[0]?.value
      );
      player.homeruns_per_nine = parseFloat(
        player.stats.filter((stat) => stat.title == "HR9")[0]
          ?.value
      );
      player.war = parseFloat(
        player.stats.filter((stat) => stat.title == "WAR")[0]?.value
      );
    });
  } else {
    columns.push({ header: "Positions", property: "position" });
    columns.push({ header: "PA", property: "plate_appearances" });
    columns.push({ header: "HR", property: "home_runs" });
    columns.push({ header: "R", property: "runs" });
    columns.push({ header: "RBI", property: "rbi" });
    columns.push({ header: "SB", property: "stolen_bases" });
    columns.push({ header: "AVG", property: "average" });
    columns.push({ header: "OBP", property: "obp" });
    columns.push({ header: "SLG", property: "slugging" });
    columns.push({ header: "OPS", property: "ops" });
    columns.push({ header: "WAR", property: "war" });

    players.forEach((player) => {
      player.plate_appearances = parseInt(
        player.stats.filter((stat) => stat.title == "PA")[0]?.value,
        10
      );
      player.home_runs = parseInt(
        player.stats.filter((stat) => stat.title == "HR")[0]?.value,
        10
      );
      player.runs = parseInt(
        player.stats.filter((stat) => stat.title == "R")[0]?.value,
        10
      );
      player.rbi = parseInt(
        player.stats.filter((stat) => stat.title == "RBI")[0]?.value,
        10
      );
      player.stolen_bases = parseInt(
        player.stats.filter((stat) => stat.title == "SB")[0]?.value,
        10
      );
      player.average = player.stats.filter(
        (stat) => stat.title == "BA"
      )[0]?.value;
      player.obp = player.stats.filter(
        (stat) => stat.title == "OBP"
      )[0]?.value;
      player.slugging = player.stats.filter(
        (stat) => stat.title == "SLG"
      )[0]?.value;
      player.ops = player.stats.filter(
        (stat) => stat.title == "OPS"
      )[0]?.value;
      player.war = parseFloat(
        player.stats.filter((stat) => stat.title == "WAR")[0]?.value
      );
    });
  }


  return (
    <Box round="small" overflow="hidden" border={{ color: "border", size: "xsmall" }}>
      <DataTable
        columns={columns}
        data={players}
        sortable={true}
        fill
        background={{
          header: "dark-1",
          body: ["white", "light-1"]
        }}
      />
    </Box>
  );
}
