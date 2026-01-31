import React from 'react';
import { Box, Spinner, Text } from 'grommet';

export default function LoadingState({ message = "Loading..." }) {
  return (
    <Box align="center" pad="large" gap="small">
      <Spinner size="medium" />
      <Text color="text-weak">{message}</Text>
    </Box>
  );
}
