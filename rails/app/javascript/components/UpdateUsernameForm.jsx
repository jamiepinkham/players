import React, { useState } from "react";

import { Box, Form, FormField, TextInput, Button, Text } from "grommet";
import { User } from "grommet-icons";

export default function UpdateUsernameForm({ auth, currentUsername }) {
  const [formState, setFormState] = useState({
    username: currentUsername || "",
    successMessage: "",
    errorMessage: "",
  });

  const validateUsername = (value) => {
    const username = value.username;
    if (!username || username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username.length > 50) {
      return "Username must be 50 characters or less";
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      return "Username can only contain letters, numbers, underscores and periods";
    }
    return "";
  };

  return (
    <Box pad="medium">
      <Form
        validate="change"
        value={formState}
        onChange={(nextValue) => {
          setFormState({ ...nextValue, successMessage: "", errorMessage: "" });
        }}
        onReset={() =>
          setFormState({
            username: currentUsername || "",
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
          name="username-input-id"
          htmlFor="username-input-id"
          validate={validateUsername}
        >
          <TextInput
            id="username"
            name="username"
            icon={<User />}
            placeholder="username"
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
    </Box>
  );
}
