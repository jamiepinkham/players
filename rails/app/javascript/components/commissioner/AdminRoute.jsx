import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/use_auth";
import { Box, Text } from "grommet";

const AdminRoute = ({ children }) => {
  let auth = useAuth();

  // Debug logging
  console.log('AdminRoute - auth state:', {
    isValidating: auth.isValidating,
    isSignedIn: auth.isSignedIn,
    isAdmin: auth.isAdmin
  });

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

  // Redirect to home if not admin
  if (!auth.isAdmin) {
    return (
      <Box
        fill
        align="center"
        justify="center"
        pad="large"
      >
        <Text size="large" color="status-error">
          Access Denied - Admin Only
        </Text>
      </Box>
    );
  }

  // Render children components
  return children;
};

export default AdminRoute;
