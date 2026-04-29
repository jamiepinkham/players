import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  Spinner,
  Layer,
  TextInput,
  DataTable,
  Select,
  FormField,
  CheckBox,
} from "grommet";
import { Edit, Trash } from "grommet-icons";

const UsersTab = ({ allTeams, setNotification }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', name: '', password: '', team_id: null, is_admin: false });
  const [savingUser, setSavingUser] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await axios.get('/api/commissioner/users');
      setAllUsers(response.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setNotification({ message: 'Failed to load users', type: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      setNotification({ message: 'Username and password are required', type: 'error' });
      return;
    }

    if (newUser.password.length < 6) {
      setNotification({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setSavingUser(true);
    try {
      await axios.post('/api/commissioner/users', { user: newUser });
      setNotification({ message: 'User created successfully!', type: 'success' });
      setShowCreateUserModal(false);
      setNewUser({ username: '', name: '', password: '', team_id: null, is_admin: false });
      await fetchAllUsers();
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to create user', type: 'error' });
    } finally {
      setSavingUser(false);
    }
  };

  const handleUpdateUser = async () => {
    setSavingUser(true);
    try {
      const updateData = { ...editingUser };
      // Remove password if empty (don't update it)
      if (!updateData.password) {
        delete updateData.password;
      }

      await axios.patch(`/api/commissioner/users/${editingUser.id}`, { user: updateData });
      setNotification({ message: 'User updated successfully!', type: 'success' });
      setShowEditUserModal(false);
      setEditingUser(null);
      await fetchAllUsers();
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to update user', type: 'error' });
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/commissioner/users/${userId}`);
      setNotification({ message: 'User deleted successfully!', type: 'success' });
      await fetchAllUsers();
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to delete user', type: 'error' });
    }
  };

  return (
    <Box>
      <Box direction="row" justify="between" align="center" margin={{ bottom: 'medium' }}>
        <Heading level={2} margin="none">User Management</Heading>
        <Button
          label="Create User"
          primary
          onClick={() => setShowCreateUserModal(true)}
        />
      </Box>

      {/* Summary Stats */}
      <Box direction="row" gap="medium" margin={{ bottom: 'medium' }}>
        <Card background="light-2" pad="small">
          <Text size="small" color="dark-4">Total Users</Text>
          <Text size="xlarge" weight="bold">{allUsers.length}</Text>
        </Card>
        <Card background="light-2" pad="small">
          <Text size="small" color="dark-4">Admins</Text>
          <Text size="xlarge" weight="bold">{allUsers.filter(u => u.is_admin).length}</Text>
        </Card>
        <Card background="light-2" pad="small">
          <Text size="small" color="dark-4">Team Owners</Text>
          <Text size="xlarge" weight="bold">{allUsers.filter(u => u.team_id).length}</Text>
        </Card>
      </Box>

      {/* Filter */}
      <Box margin={{ bottom: 'medium' }}>
        <Select
          options={[
            { label: 'All Users', value: 'all' },
            { label: 'Admins Only', value: 'admins' },
            { label: 'Team Owners', value: 'owners' },
            { label: 'Unassigned', value: 'unassigned' }
          ]}
          value={userRoleFilter}
          onChange={({ option }) => setUserRoleFilter(option.value)}
          labelKey="label"
          valueKey={{ key: 'value', reduce: true }}
        />
      </Box>

      {/* Users DataTable */}
      {loadingUsers ? (
        <Box align="center" pad="large">
          <Spinner />
          <Text margin={{ top: 'small' }}>Loading users...</Text>
        </Box>
      ) : (
        <DataTable
          columns={[
            { property: 'username', header: 'Username', primary: true, sortable: true },
            { property: 'name', header: 'Display Name', sortable: true },
            {
              property: 'team_name',
              header: 'Team',
              sortable: true,
              render: datum => datum.team_name || <Text color="dark-4">Unassigned</Text>
            },
            {
              property: 'is_admin',
              header: 'Admin',
              render: datum => datum.is_admin ? (
                <Box background="status-ok" pad={{ horizontal: 'xsmall', vertical: 'xxsmall' }} round="xsmall">
                  <Text size="xsmall" weight="bold" color="white">ADMIN</Text>
                </Box>
              ) : null
            },
            {
              property: 'last_sign_in_at',
              header: 'Last Sign In',
              sortable: true,
              render: datum => datum.last_sign_in_at ? new Date(datum.last_sign_in_at).toLocaleDateString() : 'Never'
            },
            {
              property: 'actions',
              header: 'Actions',
              render: datum => (
                <Box direction="row" gap="xsmall">
                  <Button
                    icon={<Edit />}
                    onClick={() => {
                      setEditingUser({ ...datum, password: '' });
                      setShowEditUserModal(true);
                    }}
                    size="small"
                  />
                  <Button
                    icon={<Trash />}
                    onClick={() => handleDeleteUser(datum.id, datum.username)}
                    size="small"
                    color="status-error"
                  />
                </Box>
              )
            }
          ]}
          data={allUsers.filter(user => {
            if (userRoleFilter === 'admins') return user.is_admin;
            if (userRoleFilter === 'owners') return user.team_id;
            if (userRoleFilter === 'unassigned') return !user.team_id;
            return true;
          })}
          sort={{ property: 'username', direction: 'asc' }}
        />
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <Layer
          position="center"
          onEsc={() => setShowCreateUserModal(false)}
          onClickOutside={() => setShowCreateUserModal(false)}
        >
          <Box pad="medium" gap="small" width="medium">
            <Heading level={3} margin="none">Create User</Heading>

            <FormField label="Username" required help="3-50 characters, letters, numbers, _ and . only">
              <TextInput
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </FormField>

            <FormField label="Display Name">
              <TextInput
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </FormField>

            <FormField label="Password" required help="Minimum 6 characters">
              <TextInput
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </FormField>

            <FormField label="Team">
              <Select
                options={[{ id: null, name: 'Unassigned' }, ...allTeams]}
                value={newUser.team_id}
                onChange={({ option }) => setNewUser({ ...newUser, team_id: option.id })}
                labelKey="name"
                valueKey={{ key: 'id', reduce: true }}
              />
            </FormField>

            <CheckBox
              checked={newUser.is_admin}
              label="Is Admin"
              onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
            />

            <Box direction="row" gap="small" justify="end" margin={{ top: 'small' }}>
              <Button label="Cancel" onClick={() => setShowCreateUserModal(false)} />
              <Button
                label={savingUser ? 'Creating...' : 'Create User'}
                primary
                onClick={handleCreateUser}
                disabled={savingUser || !newUser.username || !newUser.password}
              />
            </Box>
          </Box>
        </Layer>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <Layer
          position="center"
          onEsc={() => setShowEditUserModal(false)}
          onClickOutside={() => setShowEditUserModal(false)}
        >
          <Box pad="medium" gap="small" width="medium">
            <Heading level={3} margin="none">Edit User: {editingUser.username}</Heading>

            <FormField label="Username" required>
              <TextInput
                value={editingUser.username}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
              />
            </FormField>

            <FormField label="Display Name">
              <TextInput
                value={editingUser.name || ''}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              />
            </FormField>

            <FormField label="New Password" help="Leave blank to keep current password">
              <TextInput
                type="password"
                value={editingUser.password}
                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
              />
            </FormField>

            <FormField label="Team">
              <Select
                options={[{ id: null, name: 'Unassigned' }, ...allTeams]}
                value={editingUser.team_id}
                onChange={({ option }) => setEditingUser({ ...editingUser, team_id: option.id })}
                labelKey="name"
                valueKey={{ key: 'id', reduce: true }}
              />
            </FormField>

            <CheckBox
              checked={editingUser.is_admin}
              label="Is Admin"
              onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })}
            />

            <Box direction="row" gap="small" justify="end" margin={{ top: 'small' }}>
              <Button label="Cancel" onClick={() => setShowEditUserModal(false)} />
              <Button
                label={savingUser ? 'Updating...' : 'Update User'}
                primary
                onClick={handleUpdateUser}
                disabled={savingUser}
              />
            </Box>
          </Box>
        </Layer>
      )}
    </Box>
  );
};

export default UsersTab;
