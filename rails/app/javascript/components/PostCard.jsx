import { Box, Heading, Image, Text, Anchor } from "grommet";
import * as React from "react";

export default function PostCard(props) {
  function formatDate(dateString) {
    var options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString([], options);
  }
  return (
    <div id="article">
      <Box
        round="small"
        elevation="small"
        border={{
          side: "all",
          color: "border",
          size: "xsmall",
        }}
        margin={{
          top: "small",
          bottom: "medium",
          right: "small",
          left: "small",
        }}
      >
        {props.cover ? (
          <div>
            <Box round={{ size: "small", corner: "top" }} overflow="hidden">
              <Box height="small" background="border">
                <Image src={props.cover} fit="cover" />
              </Box>
            </Box>
          </div>
        ) : (
          <div />
        )}

        <Box pad="medium">
          <Heading margin={{ vertical: "small" }} level="2">
            {props.title}
          </Heading>
          <Text color="text">{props.excerpt}</Text>
          <Text color="text" margin={{ top: "small" }} size="small">
            {formatDate(props.date)}
          </Text>
          <Anchor href={props.link} label="Read more..." />
        </Box>
      </Box>
    </div>
  );
}
