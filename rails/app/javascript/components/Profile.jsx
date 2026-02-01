import React from "react";
import { useAuth } from "../hooks/use_auth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "graphql-hooks";

import { Tabs, Tab, Box, Button, Heading, Spinner, Text } from "grommet";

import ResetPasswordForm from "./ResetPasswordForm";
import UpdateUsernameForm from "./UpdateUsernameForm";

const CURRENT_USER_QUERY = `
  query CurrentUser {
    currentUser {
      id
      username
      team {
        id
        name
        teamEmails {
          id
          email
          primary
          receiveTradeNotifications
        }
      }
    }
  }
`;

export default function Profile() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { loading, data, refetch } = useQuery(CURRENT_USER_QUERY);

  if (loading) return <Spinner size="medium" alignSelf="center" />;

  const user = data?.currentUser;

  return (
    <Box direction="column" gap="medium" pad={{ vertical: "medium" }}>
      <Box
        background="light-1"
        pad="medium"
        round="small"
        gap="small"
        elevation="small"
        border={{
          side: "all",
          color: "border",
          size: "xsmall",
        }}
      >
        <Box direction="row" gap="xsmall">
          <Text weight="bold">Username:</Text>
          <Text>{user?.username}</Text>
        </Box>
        <Box direction="row" gap="xsmall">
          <Text weight="bold">Team:</Text>
          <Text>{user?.team?.name || "N/A"}</Text>
        </Box>
        {user?.team && (
          <Box gap="xsmall">
            <Text weight="bold">Team Emails:</Text>
            {user.team.teamEmails && user.team.teamEmails.length > 0 ? (
              <Box pad={{ left: "small" }} gap="xxsmall">
                {user.team.teamEmails.map((teamEmail) => (
                  <Box key={teamEmail.id} direction="row" gap="xsmall" align="center">
                    <Text>{teamEmail.email}</Text>
                    {teamEmail.primary && (
                      <Text size="xsmall" color="brand" weight="bold">(Primary)</Text>
                    )}
                    {teamEmail.receiveTradeNotifications && (
                      <Text size="xsmall" color="status-ok">(Trade Notifications)</Text>
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Text pad={{ left: "small" }} color="status-critical">No emails configured</Text>
            )}
          </Box>
        )}
        <Box pad={{ top: "small" }} border={{ side: "top", color: "light-4" }}>
          <Button
            href="/sign_in"
            label="Sign Out"
            onClick={() => {
              auth.signOut().then(() => {
                navigate("/");
              });
            }}
            alignSelf="start"
          />
        </Box>
      </Box>

      <Tabs justify="start">
        <Tab title="Change Username">
          <Box pad="medium" gap="small">
            <Box direction="row" gap="xsmall">
              <Text weight="bold">Current username:</Text>
              <Text>{user?.username}</Text>
            </Box>
            <UpdateUsernameForm auth={auth} currentUsername={user?.username} onSuccess={refetch} />
          </Box>
        </Tab>
        <Tab title="Change Password">
          <Box pad="medium">
            <ResetPasswordForm auth={auth} />
          </Box>
        </Tab>
      </Tabs>
    </Box>
  );
}
