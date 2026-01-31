import React, { useState } from "react";

import { Box, Form, FormField, TextInput, Button, Text } from "grommet";
import { User } from "grommet-icons";

export default function UpdateUsernameForm({ auth, currentUsername, onSuccess }) {
  const [formState, setFormState] = useState({
    username: "",
    successMessage: "",
    errorMessage: "",
  });

  const validateUsername = (username) => {
    if (!username || username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username.length > 50) {
      return "Username must be 50 characters or less";
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      return "Username can only contain letters, numbers, underscores and periods";
    }
    return undefined;
  };

  return (
    <Form
      validate="change"
      value={formState}
      onChange={(nextValue) => {
        setFormState({ ...nextValue, successMessage: "", errorMessage: "" });
      }}
      onReset={() =>
        setFormState({
          username: "",
          successMessage: "",
          errorMessage: "",
        })
      }
      onSubmit={({ value }) => {
        auth
          .changeUsername(value.username)
          .then((response) => {
            if (response && response.success) {
              setFormState({
                ...formState,
                successMessage: "Username updated successfully!",
                errorMessage: "",
              });
              // Refetch user data to update the UI
              if (onSuccess) {
                onSuccess();
              }
            } else {
              setFormState({
                ...formState,
                successMessage: "",
                errorMessage: response?.error || "Failed to update username",
              });
            }
          })
          .catch((error) => {
            setFormState({
              ...formState,
              successMessage: "",
              errorMessage: error.message || "Failed to update username",
            });
          });
      }}
    >
      <FormField
        name="username"
        htmlFor="username"
        validate={validateUsername}
      >
        <TextInput
          id="username"
          name="username"
          placeholder="new username"
          value={formState.username}
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
        <Button type="submit" primary label="Update Username" />
      </Box>
    </Form>
  );
}
