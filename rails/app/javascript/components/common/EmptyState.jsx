import React from 'react';
import { Box, Heading, Text } from 'grommet';

export default function EmptyState({ icon: Icon, title, message, children }) {
  return (
    <Box align="center" pad="large" gap="small">
      {Icon && <Icon size="large" color="text-weak" />}
      <Heading level={3} margin="none">{title}</Heading>
      {message && <Text color="text-weak" textAlign="center">{message}</Text>}
      {children}
    </Box>
  );
}
