import React, { useState } from "react";

import { Box, Form, FormField, TextInput, Button, Text } from "grommet";

import { Lock } from "grommet-icons";

export default function ResetPasswordForm({ auth }) {
  const validateLength = (field, value) => {
    if (value.newPassword.length > 0 && value.newPassword.length < 8) {
      return "not long enough";
    }
    return "";
  };

  const [formState, setFormState] = useState({
    newPassword: "",
    newPasswordConfirm: "",
    errorMessage: "",
    passwordValid: false,
    formValid: false,
  });
  return (
    <Box pad="medium">
      <Form
        validate="change"
        value={formState}
        onChange={(nextValue) => {
          setFormState(nextValue);
        }}
        onReset={() =>
          setFormState({
            newPassword: "",
            newPasswordConfirm: "",
            formErrors: { password: "" },
            passwordValid: false,
            formValid: false,
          })
        }
        onSubmit={({ value }) => {
          auth.changePassword(value.newPassword);
        }}
      >
        <FormField name="new-password-input-id" htmlFor="new-password-input-id">
          <TextInput
            type="password"
            id="newPassword"
            name="newPassword"
            icon={<Lock />}
            pattern=".{8,}"
            required
            title="8 characters minimum"
            placeholder="password"
            value={formState.newPassword}
          />
        </FormField>
        <FormField
          name="password-confirm-input-id"
          htmlFor="password-confirm-input-id"
          validate={validateLength}
        >
          <TextInput
            type="password"
            id="newPasswordConfirm"
            name="newPasswordConfirm"
            icon={<Lock />}
            required
            placeholder="again"
            value={formState.newPasswordConfirm}
          />
        </FormField>
        <Box pad={{ horizontal: "small" }}>
          <Text color="status-error">{formState.errorMessage}</Text>
        </Box>
        <Box direction="row" justify="between" margin={{ top: "medium" }}>
          <Button
            type="submit"
            primary
            label="Submit"
            disabled={formState.formValid}
          />
        </Box>
      </Form>
    </Box>
  );
}
