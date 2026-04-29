import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ClientContext } from "graphql-hooks";
import { ResponsiveContext } from "grommet";
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  validateToken,
  redirectToLogin
} from "../utils/auth";

// Add axios interceptor to include JWT token in requests
axios.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add axios interceptor for 401 responses
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      clearAuthToken();
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

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
  const localToken = getAuthToken();
  const [token, setToken] = useState(localToken || undefined);
  const [isValidating, setIsValidating] = useState(true);

  // Safely decode token with error handling
  let decodedToken = null;
  try {
    if (token) {
      decodedToken = jwtDecode(token);
    }
  } catch (error) {
    console.error('Invalid JWT token format:', error);
    // Clear invalid token
    clearAuthToken();
    setToken(null);
  }

  const isAdmin = decodedToken ? decodedToken.adm == "true" : false;
  const isSignedIn = !!decodedToken;
  const teamId = decodedToken ? decodedToken.tm : undefined;

  // Validate token on mount
  useEffect(() => {
    async function checkAuth() {
      const currentToken = getAuthToken();
      if (currentToken) {
        const valid = await validateToken(currentToken);
        if (!valid) {
          setToken(null);
        }
      }
      setIsValidating(false);
    }
    checkAuth();
  }, []);
  const signIn = (username, password) => {
    return axios
      .post("/users/sign_in", {
        user: {
          username,
          password,
        },
      })
      .then((response) => {
        if (response.data.jwt) {
          const responseToken = response.data.jwt;
          // CRITICAL: Save to localStorage BEFORE updating React state
          // Otherwise React will trigger navigation before token is saved
          setAuthToken(responseToken);
          setToken(responseToken);
          return responseToken;
        }
        return null;
      });
  };

  const signOut = () => {
    clearAuthToken();
    setToken(null);
    return axios.delete("/users/sign_out", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  };

  const changePassword = (currentPassword, newPassword) => {
    let config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    return axios
      .put(
        "/users/password",
        {
          current_password: currentPassword,
          new_pass: newPassword,
        },
        config
      )
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        if (error.response && error.response.data) {
          throw new Error(error.response.data.errors || "Failed to update password");
        }
        throw error;
      });
  };

  const changeUsername = (username) => {
    let config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    return axios
      .put(
        "/users/username",
        {
          username: username,
        },
        config
      )
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        if (error.response && error.response.data) {
          throw new Error(error.response.data.error || "Failed to update username");
        }
        throw error;
      });
  };

  const sendResetInstructions = (username) => {
    return axios
      .post("/users/password", {
        user: { username: username },
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
    isValidating,
    teamId,
    token,
    signIn,
    signOut,
    sendResetInstructions,
    setPassword,
    changePassword,
    changeUsername,
  };
}
