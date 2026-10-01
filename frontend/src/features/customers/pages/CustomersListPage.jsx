import { useState } from 'react';
import { Box, Button, InputAdornment, TextField, MenuItem, Stack, IconButton, Typography, Avatar, Collapse, Chip, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useSnackbar } from 'notistack';
import PageHeader from '../../../components/layout-elements/PageHeader';
import DataTable from '../../../components/data-table/DataTable';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import StatusChip from '../../../components/feedback/StatusChip';
import CustomerFormDialog from '../components/CustomerFormDialog';
import LocationFormDialog from '../../locations/components/LocationFormDialog';
import { useCustomersList, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers';
import { useActiveLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '../../locations/hooks/useLocations';
import { useAuth } from '../../../contexts/AuthContext';

export default function CustomersListPage() {
  const { hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationCustomerId, setLocationCustomerId] = useState(null);
  const [locationCustomer, setLocationCustomer] = useState(null);
  const [deleteLocationTarget, setDeleteLocationTarget] = useState(null);

  const params = { page, pageSize, search: search || undefined, status: status || undefined, sortBy, sortOrder };
  const { data, isLoading } = useCustomersList(params);
  const { data: allLocations = [] } = useActiveLocations();

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  const columns = [
    {
      field: 'companyName',
      headerName: 'Company',
      sortable: true,
      render: (row) => {
        const customerLocations = allLocations.filter((l) => l.customerId === row.id);
        const isExpanded = expandedCustomer === row.id;

        return (
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar variant="rounded" sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
                <BusinessIcon fontSize="small" />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {row.companyName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.contactPerson || '—'}
                </Typography>
              </Box>
              {customerLocations.length > 0 && (
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setExpandedCustomer(isExpanded ? null : row.id); }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Chip size="small" icon={<LocationOnIcon />} label={customerLocations.length} sx={{ height: 22, fontSize: 11 }} />
                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </Stack>
                </IconButton>
              )}
              {customerLocations.length === 0 && hasPermission('customers:create') && (
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setLocationCustomerId(row.id); setLocationCustomer(row); setEditingLocation(null); setLocationFormOpen(true); }}
                  title="Add location"
                >
                  <AddIcon fontSize="small" color="primary" />
                </IconButton>
              )}
            </Stack>
            <Collapse in={isExpanded}>
              <Stack spacing={0.5} sx={{ mt: 1, ml: 6.5 }}>
                {customerLocations.map((loc) => (
                  <Stack key={loc.id} direction="row" spacing={0.5} alignItems="center">
                    <LocationOnIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                    <Typography variant="caption" fontWeight={500} sx={{ flex: 1 }}>{loc.name}</Typography>
                    {hasPermission('customers:update') && (
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingLocation(loc); setLocationCustomerId(row.id); setLocationCustomer(row); setLocationFormOpen(true); }}>
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                    {hasPermission('customers:delete') && (
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteLocationTarget(loc); }}>
                        <DeleteIcon sx={{ fontSize: 14 }} color="error" />
                      </IconButton>
                    )}
                  </Stack>
                ))}
                {hasPermission('customers:create') && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={(e) => { e.stopPropagation(); setLocationCustomerId(row.id); setLocationCustomer(row); setEditingLocation(null); setLocationFormOpen(true); }}
                    sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                  >
                    Add Location
                  </Button>
                )}
              </Stack>
            </Collapse>
          </Box>
        );
      },
    },
    { field: 'phone', headerName: 'Phone', sortable: false },
    {
      field: 'address',
      headerName: 'Address',
      sortable: false,
      render: (row) => {
        const parts = [row.addressLine1, row.addressLine2, row.city, row.country].filter(Boolean);
        const fullAddress = parts.join(', ');
        if (!fullAddress) return '—';
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
        return (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ maxWidth: 260 }}>
            <Typography variant="body2" noWrap title={fullAddress} sx={{ flex: 1, minWidth: 0 }}>
              {fullAddress}
            </Typography>
            <Tooltip title="Open in Google Maps">
              <IconButton
                size="small"
                component="a"
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <MapIcon sx={{ fontSize: 16 }} color="primary" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
    { field: 'city', headerName: 'City', sortable: true, render: (row) => row.city || '-' },
    { field: 'status', headerName: 'Status', sortable: true, render: (row) => <StatusChip status={row.status} /> },
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
    else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editing) {
        await updateCustomer.mutateAsync({ id: editing.id, payload: values });
        enqueueSnackbar('Customer updated successfully', { variant: 'success' });
      } else {
        await createCustomer.mutateAsync(values);
        enqueueSnackbar('Customer created successfully', { variant: 'success' });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer.mutateAsync(deleteTarget.id);
      enqueueSnackbar('Customer deleted successfully', { variant: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete customer', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<BusinessIcon fontSize="medium" />}
        title="Customer Management"
        description="Manage client companies your transport operations serve."
        actions={
          hasPermission('customers:create') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}>
              New Customer
            </Button>
          )
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search by company, contact, phone or email"
          size="small"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          sx={{ width: { xs: '100%', sm: 420 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          sx={{ width: { xs: '100%', sm: 160 } }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
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
        emptyMessage="No customers found. Create your first customer to get started."
      />

      <CustomerFormDialog
        open={formOpen}
        customer={editing}
        submitting={createCustomer.isPending || updateCustomer.isPending}
        onSubmit={handleFormSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete customer"
        message={`Are you sure you want to delete ${deleteTarget?.companyName}?`}
        loading={deleteCustomer.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <LocationFormDialog
        open={locationFormOpen}
        location={editingLocation ? { ...editingLocation, customerId: locationCustomerId } : null}
        customer={locationCustomer}
        submitting={createLocation.isPending || updateLocation.isPending}
        onSubmit={async (values) => {
          try {
            const payload = { ...values, customerId: locationCustomerId };
            if (editingLocation) {
              await updateLocation.mutateAsync({ id: editingLocation.id, payload });
              enqueueSnackbar('Location updated', { variant: 'success' });
            } else {
              await createLocation.mutateAsync(payload);
              enqueueSnackbar('Location created', { variant: 'success' });
            }
            setLocationFormOpen(false);
            setEditingLocation(null);
            setLocationCustomer(null);
          } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Failed to save location', { variant: 'error' });
          }
        }}
        onClose={() => { setLocationFormOpen(false); setEditingLocation(null); setLocationCustomer(null); }}
      />

      <ConfirmDialog
        open={!!deleteLocationTarget}
        title="Delete location"
        message={`Are you sure you want to delete "${deleteLocationTarget?.name}"?`}
        loading={deleteLocation.isPending}
        onConfirm={async () => {
          try {
            await deleteLocation.mutateAsync(deleteLocationTarget.id);
            enqueueSnackbar('Location deleted', { variant: 'success' });
            setDeleteLocationTarget(null);
          } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Failed to delete location', { variant: 'error' });
          }
        }}
        onClose={() => setDeleteLocationTarget(null)}
      />
    </Box>
  );
}
