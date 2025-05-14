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

export default function EmailResetForm() {
  let [value, setValue] = useState({ email: "" });
  let [error, setError] = useState(false);
  let history = useHistory();
  let auth = useAuth();
  let callback = useCallback(
    (value) => {
      auth.sendResetInstructions(value.email).then((response) => {
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
        <CardHeader pad="medium">Enter sign-in email address</CardHeader>
        <CardBody>
          <Form
            value={value}
            onChange={(nextValue) => setValue(nextValue)}
            onReset={() => setValue({})}
            onSubmit={({ value }) => {
              callback(value);
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
