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
import { render } from "react-dom";
import { ClientContext, GraphQLClient } from "graphql-hooks";
import { ProvideAuth } from "./hooks/use_auth"
import { BrowserRouter as Router } from "react-router-dom";

import siteTheme from "./site-theme";
import { Grommet, Box } from "grommet";
import { createGlobalStyle } from "styled-components";
import "@fontsource/fira-sans";

const GlobalStyle = createGlobalStyle`
  img {
    max-width: 100%;
  }
  body {
    margin: 0;
  }
  a:hover {
    opacity: 0.9;
  }
`;

import App from "./components/App";

const client = new GraphQLClient({ url: "/graphql" });

function AppShell() {
  return (
    <ClientContext.Provider value={client}>
      <ProvideAuth>
        <Router basename="/">
          <Grommet theme={siteTheme}>
            <GlobalStyle />
            <Box direction="column" align="center">
              <Box width="xxlarge">
                <App />
              </Box>
            </Box>
          </Grommet>
        </Router>
      </ProvideAuth>
    </ClientContext.Provider>
  );
}

render(<AppShell />, document.getElementById("app-root"));// Entry point for the build script in your package.json
