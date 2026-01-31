import React, { useCallback, useState } from "react";
import { useHistory } from "react-router";
import { useAuth } from "../hooks/use_auth";

import {
  Box,
  Form,
  FormField,
  TextInput,
  Button,
  Card,
  CardHeader,
  CardBody,
  Anchor,
} from "grommet";

import { Login, MailOption } from "grommet-icons";

export default function ForgotPasswordForm() {
  let [value, setValue] = useState({ username: "" });
  let [error, setError] = useState(false);
  let history = useHistory();
  let auth = useAuth();
  let callback = useCallback(
    (value) => {
      auth.sendResetInstructions(value.username).then((response) => {
        if (response == null) {
          setError(true);
        } else {
          setError(false);
          history.push("/sign_in");
        }
      });
    },
    [setError]
  );
  return (
    <Box align="center">
      <Card pad="medium">
        <CardHeader pad="medium">Enter your username</CardHeader>
        <CardBody>
          <Form
            value={value}
            onChange={(nextValue) => setValue(nextValue)}
            onReset={() => setValue({})}
            onSubmit={({ value }) => {
              callback(value);
            }}
          >
            <FormField name="username-input-id" htmlFor="username-input-id">
              <TextInput
                id="username"
                name="username"
                placeholder="username"
                value={value.username}
              />
            </FormField>
            <Box direction="column" gap="small" justify="center">
              <Button type="submit" primary label="Submit" />
              <Anchor href="/sign_in" label="back to login" icon={<Login />} />
            </Box>
          </Form>
        </CardBody>
      </Card>
    </Box>
  );
}
