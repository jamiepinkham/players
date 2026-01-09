import React, { useState, useContext, createContext } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { ClientContext } from "graphql-hooks";
import { ResponsiveContext } from "grommet";

const authContext = createContext();

export function ProvideAuth({ children }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => {
  return useContext(authContext);
};

function useProvideAuth() {
  const client = useContext(ClientContext);
  const localToken = localStorage.getItem("bmpl-token");
  const [token, setToken] = useState(localToken || undefined);
  const isAdmin = token ? jwt_decode(token).adm == "true" : false;
  const isSignedIn = token ? (jwt_decode(token) ? true : false) : false;
  const teamId = token ? jwt_decode(token).tm : undefined;
  const signIn = (login, password) => {
    return axios
      .post("/users/sign_in", {
        user: {
          login,
          password,
        },
      })
      .then((response) => {
        if (response.data.jwt) {
          const responseToken = response.data.jwt;
          setToken(responseToken);
          localStorage.setItem("bmpl-token", responseToken);
          client.setHeader("Authorization", `Bearer ${responseToken}`);
          return responseToken;
        }
      });
  };

  const signOut = () => {
    localStorage.clear();
    setToken(null);
    return axios.delete("/users/sign_out", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const changePassword = (password) => {
    let config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    return axios
      .put(
        "users/password",
        {
          new_pass: password,
        },
        config
      )
      .then((response) => {
        return response.data;
      });
  };

  const sendResetInstructions = (email) => {
    return axios
      .post("/users/password", {
        user: { email: email },
      })
      .then((response) => {
        return response.data;
      })
      .catch(() => {
        return null;
      });
  };

  const setPassword = (token, password) => {
    return axios
      .put("/users/password", {
        user: {
          reset_password_token: token,
          password: password,
          password_confirmation: password,
        },
      })
      .then((response) => {
        return response.data;
      });
  };

  return {
    isAdmin,
    isSignedIn,
    teamId,
    token,
    signIn,
    signOut,
    sendResetInstructions,
    setPassword,
    changePassword,
  };
}
