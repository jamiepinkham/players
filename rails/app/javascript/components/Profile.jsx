import React from "react";
import { useAuth } from "../hooks/use_auth";
import { useHistory } from "react-router";
import { useQuery } from "graphql-hooks";

import { Accordion, AccordionPanel, Box, Button, Spinner } from "grommet";

import ResetPasswordForm from "./ResetPasswordForm";
import UpdateUsernameForm from "./UpdateUsernameForm";

const CURRENT_USER_QUERY = `
  query CurrentUser {
    currentUser {
      id
      username
      name
    }
  }
`;

export default function Profile() {
  const auth = useAuth();
  const history = useHistory();
  const { loading, data } = useQuery(CURRENT_USER_QUERY);

  if (loading) return <Spinner size="medium" alignSelf="center" />;

  return (
    <Box direction="column">
      <Accordion pad="xsmall" multiple={true}>
        <AccordionPanel label="Edit Username">
          <UpdateUsernameForm auth={auth} currentUsername={data?.currentUser?.username} />
        </AccordionPanel>
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
