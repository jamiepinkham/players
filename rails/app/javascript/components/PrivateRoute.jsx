import React from "react";
import { Redirect } from "react-router";
import { useAuth } from "../hooks/use_auth";

const PrivateRoute = ({ component: Component, ...rest }) => {
  let auth = useAuth();
  if (!auth.isSignedIn && location.pathname != "/sign_in") {
    return <Redirect to="/sign_in" />;
  }
  return <Component {...rest} />;
};

export default PrivateRoute;
