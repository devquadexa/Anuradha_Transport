import { useState } from 'react';
import { Box, Button, InputAdornment, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import IconButton from '@mui/material/IconButton';
import { useSnackbar } from 'notistack';
import PageHeader from '../../../components/layout-elements/PageHeader';
import DataTable from '../../../components/data-table/DataTable';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import StatusChip from '../../../components/feedback/StatusChip';
import UserFormDialog from '../components/UserFormDialog';
import { useUsersList, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { useAuth } from '../../../contexts/AuthContext';

export default function UsersListPage() {
  const { hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = { page, pageSize, search: search || undefined, sortBy, sortOrder };
  const { data, isLoading } = useUsersList(params);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const columns = [
    { field: 'fullName', headerName: 'Name', sortable: false },
    { field: 'email', headerName: 'Email', sortable: true },
    { field: 'roleName', headerName: 'Role', sortable: false, render: (row) => row.roleName?.replace('_', ' ') || '-' },
    { field: 'phone', headerName: 'Phone', sortable: false, render: (row) => row.phone || '-' },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          {hasPermission('users:update') && (
            <IconButton
              size="small"
              onClick={() => {
                setEditingUser(row);
                setFormOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission('users:delete') && (
            <IconButton size="small" onClick={() => setDeleteTarget(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      ),
    },
  ];

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, payload: values });
        enqueueSnackbar('User updated successfully', { variant: 'success' });
      } else {
        await createUser.mutateAsync(values);
        enqueueSnackbar('User created successfully', { variant: 'success' });
      }
      setFormOpen(false);
      setEditingUser(null);
    } catch (err) {
      const data = err.response?.data;
      // Surface specific field validation messages when present.
      const detailMsg = Array.isArray(data?.details)
        ? data.details.map((d) => (typeof d === 'string' ? d : d.message)).filter(Boolean).join(' • ')
        : null;
      enqueueSnackbar(detailMsg || data?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete user', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<PeopleIcon fontSize="medium" />}
        title="User Management"
        description="Manage system users, roles, and account access."
        actions={
          hasPermission('users:create') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingUser(null);
                setFormOpen(true);
              }}
            >
              New User
            </Button>
          )
        }
      />

      <TextField
        placeholder="Search by name or email"
        size="small"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        sx={{ mb: 2, width: { xs: '100%', sm: 360 } }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />

      <DataTable
        columns={columns}
        rows={data?.data || []}
        totalCount={data?.meta?.total || 0}
        page={page}
        pageSize={pageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onSortChange={handleSortChange}
      />

      <UserFormDialog
        open={formOpen}
        user={editingUser}
        submitting={createUser.isPending || updateUser.isPending}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This action can be reverted by an administrator.`}
        loading={deleteUser.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
