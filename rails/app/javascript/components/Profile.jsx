import React from "react";
import { useAuth } from "../hooks/use_auth";
import { useHistory } from "react-router";
import { useQuery } from "graphql-hooks";

import { Accordion, AccordionPanel, Box, Button, Heading, Spinner, Text } from "grommet";

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

  const user = data?.currentUser;

  return (
    <Box direction="column" gap="medium" pad={{ vertical: "medium" }}>
      <Heading level={2} margin={{ top: "none", bottom: "small" }}>
        Profile
      </Heading>

      <Box background="light-2" pad="medium" round="small" gap="xsmall">
        {user?.name && (
          <Text size="large" weight="bold">
            {user.name}
          </Text>
        )}
        <Box direction="row" gap="xsmall">
          <Text weight="bold">Username:</Text>
          <Text>{user?.username}</Text>
        </Box>
      </Box>

      <Accordion pad="xsmall" multiple={true}>
        <AccordionPanel label={`Change Username${user?.username ? ` (current: ${user.username})` : ''}`}>
          <UpdateUsernameForm auth={auth} currentUsername={user?.username} />
        </AccordionPanel>
        <AccordionPanel label="Change Password">
          <ResetPasswordForm auth={auth} />
        </AccordionPanel>
      </Accordion>

      <Box pad={{ top: "medium" }} border={{ side: "top", color: "light-4" }}>
        <Button
          href="/sign_in"
          label="Sign Out"
          onClick={() => {
            auth.signOut().then(() => {
              history.push("/");
            });
          }}
          alignSelf="start"
        />
      </Box>
    </Box>
  );
}
