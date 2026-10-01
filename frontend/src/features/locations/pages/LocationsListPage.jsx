import { useState } from 'react';
import { Box, Button, InputAdornment, TextField, MenuItem, Stack, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useSnackbar } from 'notistack';
import PageHeader from '../../../components/layout-elements/PageHeader';
import DataTable from '../../../components/data-table/DataTable';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import LocationFormDialog from '../components/LocationFormDialog';
import { useLocationsList, useCreateLocation, useUpdateLocation, useDeleteLocation } from '../hooks/useLocations';
import { useAuth } from '../../../contexts/AuthContext';

export default function LocationsListPage() {
  const { hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const params = { page, pageSize, search: search || undefined, sortBy, sortOrder };
  const { data, isLoading } = useLocationsList(params);

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  const columns = [
    {
      field: 'name',
      headerName: 'Location',
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <LocationOnIcon fontSize="small" color="primary" />
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
            {row.address && <Typography variant="caption" color="text.secondary">{row.address}</Typography>}
          </Box>
        </Stack>
      ),
    },
    {
      field: 'customer',
      headerName: 'Customer',
      render: (row) => row.customer?.companyName || '—',
    },
    {
      field: 'contactName',
      headerName: 'Contact',
      render: (row) => row.contactName ? `${row.contactName}${row.contactPhone ? ` • ${row.contactPhone}` : ''}` : '—',
    },
    {
      field: 'actions',
      headerName: '',
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          {hasPermission('customers:update') && (
            <IconButton size="small" onClick={() => { setEditing(row); setFormOpen(true); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission('customers:delete') && (
            <IconButton size="small" onClick={() => setDeleteTarget(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      ),
    },
  ];

  const handleSortChange = (field) => {
    if (sortBy === field) setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    else { setSortBy(field); setSortOrder('ASC'); }
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editing) {
        await updateLocation.mutateAsync({ id: editing.id, payload: values });
        enqueueSnackbar('Location updated successfully', { variant: 'success' });
      } else {
        await createLocation.mutateAsync(values);
        enqueueSnackbar('Location created successfully', { variant: 'success' });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLocation.mutateAsync(deleteTarget.id);
      enqueueSnackbar('Location deleted successfully', { variant: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete location', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<LocationOnIcon fontSize="medium" />}
        title="Locations"
        description="Manage transport locations for customers. Click on the map to set coordinates."
        actions={
          hasPermission('customers:create') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}>
              New Location
            </Button>
          )
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search by name or address"
          size="small"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          sx={{ width: { xs: '100%', sm: 340 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Stack>

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
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onSortChange={handleSortChange}
        emptyMessage="No locations found. Add your first location to get started."
      />

      <LocationFormDialog
        open={formOpen}
        location={editing}
        submitting={createLocation.isPending || updateLocation.isPending}
        onSubmit={handleFormSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete location"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        loading={deleteLocation.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
