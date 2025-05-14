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

function SessionLogin() {
  const auth = useAuth();
  const [hasError, setHasError] = useState(false);
  const [value, setValue] = useState({ email: "", password: "" });
  const location = useLocation();
  const history = useHistory();
  const { from } = location.state || { from: { pathname: "/teams" } };
  function login(email, password) {
    auth.signIn(email, password).then((token) => {
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
        background={`url(${sliding})`}
        round="small"
        pad="medium"
      >
        <Card pad="medium" background="light-5">
          <CardHeader pad="medium">Please sign in to continue</CardHeader>
          <CardBody>
            <Form
              value={value}
              onChange={(nextValue) => setValue(nextValue)}
              onReset={() => setValue({ email: "", password: "" })}
              onSubmit={({ value }) => {
                login(value.email, value.password);
              }}
            >
              <FormField name="email-input-id" htmlFor="email-input-id">
                <TextInput
                  id="email"
                  name="email"
                  icon={<MailOption />}
                  placeholder="email"
                  value={value.email}
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
                  disabled={!value.email || !value.password ? true : false}
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
