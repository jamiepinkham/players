import React from "react";
import { Redirect } from "react-router";
import { useAuth } from "../hooks/use_auth";
import { Box, Text } from "grommet";

const PrivateRoute = ({ component: Component, ...rest }) => {
  let auth = useAuth();

  // Show loading while validating token
  if (auth.isValidating) {
    return (
      <Box
        fill
        align="center"
        justify="center"
        pad="large"
      >
        <Text size="large">Loading...</Text>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!auth.isSignedIn) {
    return <Redirect to="/sign_in" />;
  }

  return <Component {...rest} />;
};

export default PrivateRoute;
