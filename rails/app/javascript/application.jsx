/* eslint no-console:0 */
// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.
//
// To reference this file, add <%= javascript_pack_tag 'application' %> to the appropriate
// layout file, like app/views/layouts/application.html.erb

// Uncomment to copy all static images under ../images to the output folder and reference
// them with the image_pack_tag helper in views (e.g <%= image_pack_tag 'rails.png' %>)
// or the `imagePath` JavaScript helper below.
//
// const images = require.context('../images', true)
// const imagePath = (name) => images(name, true)

import React from "react";
import { createRoot } from "react-dom/client";
import { ClientContext, GraphQLClient } from "graphql-hooks";
import { ProvideAuth } from "./hooks/use_auth"
import { BrowserRouter as Router } from "react-router-dom";
import { getAuthToken, clearAuthToken, redirectToLogin } from "./utils/auth";
import axios from "axios";

import siteTheme from "./site-theme";
import { Grommet, Box } from "grommet";
import { createGlobalStyle } from "styled-components";
import "@fontsource/fira-sans";

// Configure axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

const GlobalStyle = createGlobalStyle`
  html, body, #app-root {
    height: 100%;
    margin: 0;
  }
  img {
    max-width: 100%;
  }
  a:hover {
    opacity: 0.9;
  }
`;

import App from "./components/App";

// Custom fetch wrapper with authentication error handling
const fetchWithAuth = async (url, options = {}) => {
  // Always get fresh token from localStorage
  const token = getAuthToken();

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized - token is invalid or expired
  // Backend now returns 401 for invalid tokens
  if (response.status === 401) {
    clearAuthToken();
    redirectToLogin();
  }

  return response;
};

// Initialize GraphQL client with custom fetch that handles auth
const client = new GraphQLClient({
  url: "/graphql",
  fetch: fetchWithAuth
});

function AppShell() {
  return (
    <ClientContext.Provider value={client}>
      <ProvideAuth>
        <Router basename="/">
          <Grommet theme={siteTheme} full>
            <GlobalStyle />
            <Box direction="column" fill>
              <Box width="100%" style={{ maxWidth: "1536px", margin: "0 auto" }} pad={{ horizontal: "small" }} fill>
                <App />
              </Box>
            </Box>
          </Grommet>
        </Router>
      </ProvideAuth>
    </ClientContext.Provider>
  );
}

const root = createRoot(document.getElementById("app-root"));
root.render(<AppShell />);

// Entry point for the build script in your package.json
