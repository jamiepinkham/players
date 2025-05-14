import React from "react";
import { useAuth } from "../hooks/use_auth";
import { useHistory } from "react-router";

import { Accordion, AccordionPanel, Box, Button } from "grommet";

import ResetPasswordForm from "./ResetPasswordForm";

export default function Profile() {
  const auth = useAuth();
  const history = useHistory();

  return (
    <Box direction="column">
      <Accordion pad="xsmall" multiple={true}>
        <AccordionPanel label="Edit Password">
          <ResetPasswordForm auth={auth} />
        </AccordionPanel>
        <AccordionPanel label="Sign Out">
          <Box pad="small" align="end">
            <Button
              href="/sign_in"
              label="Sign Out"
              onClick={() => {
                auth.signOut().then(() => {
                  history.push("/");
                });
              }}
            />
          </Box>
        </AccordionPanel>
      </Accordion>
    </Box>
  );
}
