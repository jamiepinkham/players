import React from "react";
import { Route, Redirect } from "react-router";
import { useAuth } from "../hooks/use_auth";
import { Box, Text } from "grommet";

const PrivateRoute = ({ component: Component, ...rest }) => {
  let auth = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
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

        // Render component with route props (includes match.params)
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;
