import { useState } from 'react';
import { Box, Button, InputAdornment, TextField, MenuItem, Stack, IconButton, Typography, Avatar, Tooltip, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import BadgeIcon from '@mui/icons-material/Badge';
import { useSnackbar } from 'notistack';
import PageHeader from '../../../components/layout-elements/PageHeader';
import DataTable from '../../../components/data-table/DataTable';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import StatusChip from '../../../components/feedback/StatusChip';
import DriverFormDialog from '../components/DriverFormDialog';
import { useDriversList, useCreateDriver, useUpdateDriver, useDeleteDriver } from '../hooks/useDrivers';
import { useAuth } from '../../../contexts/AuthContext';

const DRIVER_STATUS_COLORS = { active: 'success', inactive: 'default', on_leave: 'warning', suspended: 'error' };

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// Renders a date with a status chip: Expired / Expiring (<=30d) / Valid.
function ExpiryCell({ date, label }) {
  const days = daysUntil(date);
  if (days == null) {
    return <Typography variant="body2" color="text.secondary">—</Typography>;
  }

  let color = 'success';
  let text = 'Valid';
  let tip = `${label} is valid`;
  if (days < 0) {
    color = 'error';
    text = 'Expired';
    tip = `${label} expired ${Math.abs(days)} day(s) ago`;
  } else if (days <= 30) {
    color = 'warning';
    text = `${days}d left`;
    tip = `${label} expires within 30 days`;
  }

  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Typography variant="body2">{date}</Typography>
      <Tooltip title={tip}>
        <Chip
          size="small"
          label={text}
          color={color}
          variant={color === 'success' ? 'outlined' : 'filled'}
          sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
        />
      </Tooltip>
    </Stack>
  );
}

export default function DriversListPage() {
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

  const params = { page, pageSize, search: search || undefined, status: status || undefined, sortBy, sortOrder };
  const { data, isLoading } = useDriversList(params);

  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();

  const columns = [
    {
      field: 'fullName',
      headerName: 'Driver',
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700 }}>
            {row.firstName?.[0]}
            {row.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {row.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.phone}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    { field: 'licenseNumber', headerName: 'License No.', sortable: false },
    {
      field: 'licenseExpiry',
      headerName: 'License Expiry',
      sortable: true,
      render: (row) => <ExpiryCell date={row.licenseExpiry} label="License" />,
    },
    { field: 'vehicleNumber', headerName: 'Vehicle', sortable: false, render: (row) => row.vehicleNumber || '-' },
    {
      field: 'insuranceExpiry',
      headerName: 'Insurance',
      sortable: false,
      render: (row) => <ExpiryCell date={row.insuranceExpiry} label="Insurance" />,
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      render: (row) => <StatusChip status={row.status} colorMap={DRIVER_STATUS_COLORS} />,
    },
    {
      field: 'actions',
      headerName: '',
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          {hasPermission('drivers:update') && (
            <IconButton size="small" onClick={() => { setEditing(row); setFormOpen(true); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission('drivers:delete') && (
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
        await updateDriver.mutateAsync({ id: editing.id, payload: values });
        enqueueSnackbar('Driver updated successfully', { variant: 'success' });
      } else {
        await createDriver.mutateAsync(values);
        enqueueSnackbar('Driver created successfully', { variant: 'success' });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDriver.mutateAsync(deleteTarget.id);
      enqueueSnackbar('Driver deleted successfully', { variant: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete driver', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<BadgeIcon fontSize="medium" />}
        title="Driver Management"
        description="Manage driver profiles, licenses, and availability."
        actions={
          hasPermission('drivers:create') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}>
              New Driver
            </Button>
          )
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search by name, phone, NIC or license"
          size="small"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          sx={{ width: { xs: '100%', sm: 390 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          sx={{ width: { xs: '100%', sm: 180 } }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="on_leave">On Leave</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
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
        emptyMessage="No drivers found. Add your first driver to get started."
      />

      <DriverFormDialog
        open={formOpen}
        driver={editing}
        submitting={createDriver.isPending || updateDriver.isPending}
        onSubmit={handleFormSubmit}
        onClose={() => { setFormOpen(false); setEditing(null); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete driver"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}?`}
        loading={deleteDriver.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
