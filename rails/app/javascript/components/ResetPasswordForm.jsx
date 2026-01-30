import React, { useState } from "react";

import { Box, Form, FormField, TextInput, Button, Text } from "grommet";

import { Lock } from "grommet-icons";

export default function ResetPasswordForm({ auth }) {
  const [formState, setFormState] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
    errorMessage: "",
    successMessage: "",
  });

  const validatePasswordMatch = (passwordConfirm) => {
    if (formState.newPassword && passwordConfirm) {
      if (formState.newPassword !== passwordConfirm) {
        return "Passwords do not match";
      }
    }
    return undefined;
  };

  const validatePasswordLength = (password) => {
    if (password && password.length < 8) {
      return "Password must be at least 8 characters";
    }
    return undefined;
  };

  const isFormValid = () => {
    return (
      formState.currentPassword.length > 0 &&
      formState.newPassword.length >= 8 &&
      formState.newPassword === formState.newPasswordConfirm
    );
  };

  return (
    <Box pad="medium">
      <Form
        validate="change"
        value={formState}
        onChange={(nextValue) => {
          setFormState({ ...nextValue, errorMessage: "", successMessage: "" });
        }}
        onReset={() =>
          setFormState({
            currentPassword: "",
            newPassword: "",
            newPasswordConfirm: "",
            errorMessage: "",
            successMessage: "",
          })
        }
        onSubmit={({ value }) => {
          auth
            .changePassword(value.currentPassword, value.newPassword)
            .then((response) => {
              if (response && response.status === "ok") {
                setFormState({
                  currentPassword: "",
                  newPassword: "",
                  newPasswordConfirm: "",
                  errorMessage: "",
                  successMessage: "Password updated successfully!",
                });
              } else {
                setFormState({
                  ...formState,
                  errorMessage: response?.errors || "Failed to update password",
                  successMessage: "",
                });
              }
            })
            .catch((error) => {
              setFormState({
                ...formState,
                errorMessage: error.message || "Failed to update password",
                successMessage: "",
              });
            });
        }}
      >
        <FormField
          name="currentPassword"
          htmlFor="currentPassword"
          label="Current Password"
        >
          <TextInput
            type="password"
            id="currentPassword"
            name="currentPassword"
            icon={<Lock />}
            required
            placeholder="current password"
            value={formState.currentPassword}
          />
        </FormField>
        <FormField
          name="newPassword"
          htmlFor="newPassword"
          label="New Password"
          validate={validatePasswordLength}
        >
          <TextInput
            type="password"
            id="newPassword"
            name="newPassword"
            icon={<Lock />}
            pattern=".{8,}"
            required
            title="8 characters minimum"
            placeholder="new password"
            value={formState.newPassword}
          />
        </FormField>
        <FormField
          name="newPasswordConfirm"
          htmlFor="newPasswordConfirm"
          label="Confirm New Password"
          validate={validatePasswordMatch}
        >
          <TextInput
            type="password"
            id="newPasswordConfirm"
            name="newPasswordConfirm"
            icon={<Lock />}
            required
            placeholder="confirm new password"
            value={formState.newPasswordConfirm}
          />
        </FormField>
        <Box pad={{ horizontal: "small" }}>
          {formState.successMessage && (
            <Text color="status-ok">{formState.successMessage}</Text>
          )}
          {formState.errorMessage && (
            <Text color="status-error">{formState.errorMessage}</Text>
          )}
        </Box>
        <Box direction="row" justify="between" margin={{ top: "medium" }}>
          <Button
            type="submit"
            primary
            label="Update Password"
            disabled={!isFormValid()}
          />
        </Box>
      </Form>
    </Box>
  );
}
