import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/use_auth";

import {
  Box,
  Form,
  FormField,
  TextInput,
  Button,
  Card,
  CardHeader,
  CardBody,
} from "grommet";

import { Lock } from "grommet-icons";

export default function ChangePassword() {
  const [value, setValue] = useState({ password: "", password_confirm: "" });
  const { token } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const callback = useCallback((token, password) => {
    auth.setPassword(token, password).then(() => {
      navigate("/sign_in");
    });
  }, [auth, navigate, token]);

  return (
    <Box align="center">
      <Card pad="medium">
        <CardHeader pad="medium">Please enter your new password</CardHeader>
        <CardBody>
          <Form
            value={value}
            onChange={(nextValue) => setValue(nextValue)}
            onReset={() => setValue({ password: "", password_confirm: "" })}
            onSubmit={({ value }) => {
              callback(token, value.password);
            }}
          >
            <FormField name="password-input-id" htmlFor="password-input-id">
              <TextInput
                type="password"
                id="password"
                name="password"
                placeholder="password"
                value={value.password}
              />
            </FormField>
            <FormField
              name="password-confirm-input-id"
              htmlFor="password-confirm-input-id"
            >
              <TextInput
                type="password"
                id="password-confirm"
                name="password_confirm"
                placeholder="again"
                value={value.password_confirm}
              />
            </FormField>
            <Box direction="column" gap="small" justify="center">
              <Button
                type="submit"
                primary
                label="Submit"
                disabled={
                  !value.password ||
                  !value.password_confirm ||
                  value.password != value.password_confirm
                }
              />
            </Box>
          </Form>
        </CardBody>
      </Card>
    </Box>
  );
}
