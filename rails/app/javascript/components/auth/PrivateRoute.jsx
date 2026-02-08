import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/use_auth";
import { Box, Text } from "grommet";

const PrivateRoute = ({ children }) => {
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
    return <Navigate to="/sign_in" replace />;
  }

  // Render children components
  return children;
};

export default PrivateRoute;
