import React, { useState } from "react";
import { Redirect, useHistory, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/use_auth";

import {
  Box,
  Form,
  FormField,
  TextInput,
  Anchor,
  Button,
  Card,
  CardHeader,
  CardBody,
  Paragraph,
  Image,
} from "grommet";

import { CircleQuestion, Lock, MailOption } from "grommet-icons";

import sliding from "../images/sliding.jpg";
console.log(sliding);

function SessionLogin() {
  const auth = useAuth();
  const [hasError, setHasError] = useState(false);
  const [value, setValue] = useState({ username: "", password: "" });
  const location = useLocation();
  const history = useHistory();
  const { from } = location.state || { from: { pathname: "/teams" } };
  function login(username, password) {
    auth.signIn(username, password).then((token) => {
      if (token) {
        history.replace(from);
      } else {
        setHasError(true);
      }
    });
    // .catch(
    //     setHasError(true)
    // );
  }

  if (!auth.isSignedIn) {
    return (
      <Box
        align="center"
        background={{
          image: `url(${sliding})`,
          size: 'cover',
          position: 'center'
        }}
        round="small"
        pad="medium">
        <Card pad="medium" background="light-5">
          <CardHeader pad="medium">Please sign in to continue</CardHeader>
          <CardBody>
            <Form
              value={value}
              onChange={(nextValue) => setValue(nextValue)}
              onReset={() => setValue({ username: "", password: "" })}
              onSubmit={({ value }) => {
                login(value.username, value.password);
              }}
            >
              <FormField name="username-input-id" htmlFor="username-input-id">
                <TextInput
                  id="username"
                  name="username"
                  icon={<MailOption />}
                  placeholder="username"
                  value={value.username}
                />
              </FormField>
              <FormField name="password-input-id" htmlFor="password-input-id">
                <TextInput
                  type="password"
                  id="password"
                  name="password"
                  icon={<Lock />}
                  placeholder="password"
                  value={value.password}
                />
              </FormField>
              <Box direction="column" pad="xxsmall" justify="center">
                <Box
                  pad="small"
                  wrap
                  style={{ display: hasError ? "block" : "none" }}
                >
                  <Paragraph margin="small" color="red" size="small">
                    Username or password not found.
                  </Paragraph>
                  <Anchor
                    href="/forgot"
                    label="Forgot Password?"
                    icon={<CircleQuestion size="small" />}
                    size="small"
                  />
                </Box>
                <Button
                  type="submit"
                  primary
                  label="Submit"
                  disabled={!value.username || !value.password ? true : false}
                />
              </Box>
            </Form>
          </CardBody>
        </Card>
      </Box>
    );
  } else {
    return <Redirect to="/teams" />;
  }
}

export default SessionLogin;
