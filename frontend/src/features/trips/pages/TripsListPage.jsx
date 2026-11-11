import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, Divider, InputAdornment, TextField, MenuItem, Stack, IconButton, Typography, Chip, Pagination, Skeleton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import DriverTripCard from '../components/DriverTripCard';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useSnackbar } from 'notistack';
import PageHeader from '../../../components/layout-elements/PageHeader';
import DataTable from '../../../components/data-table/DataTable';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog';
import TripFormDialog from '../components/TripFormDialog';
import AssignDriverDialog from '../components/AssignDriverDialog';
import TripDetailDrawer from '../components/TripDetailDrawer';
import TripInvoiceDialog from '../components/TripInvoiceDialog';
import {
  useTripsList,
  useCreateTrip,
  useUpdateTrip,
  useAssignTrip,
  useUpdateTripStatus,
  useUpdateTripDriverDetails,
  useDeleteTrip,
  useSetEmergencyStop,
  useReorderStops,
} from '../hooks/useTrips';
import { useAuth } from '../../../context/AuthContext';

const TRIP_STATUS_COLORS = {
  pending: 'default',
  assigned: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const STATUS_OPTIONS = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];

export default function TripsListPage() {
  const { hasPermission, user } = useAuth();
  const isDriver = user?.role === 'DRIVER';
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('scheduledDate');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
  const [invoiceTrip, setInvoiceTrip] = useState(null);

  const params = { page, pageSize, search: search || undefined, status: status || undefined, sortBy, sortOrder };
  const { data, isLoading } = useTripsList(params);

  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const assignTrip = useAssignTrip();
  const updateStatus = useUpdateTripStatus();
  const updateDriverDetails = useUpdateTripDriverDetails();
  const deleteTrip = useDeleteTrip();
  const setEmergencyStop = useSetEmergencyStop();
  const reorderStops = useReorderStops();

  const columns = [
    {
      field: 'tripNumber',
      headerName: 'Trip #',
      sortable: true,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {row.tripNumber}
        </Typography>
      ),
    },
    {
      field: 'route',
      headerName: 'Route',
      render: (row) => (
        <Box>
          <Typography variant="body2">{row.origin} → {row.destination}</Typography>
        </Box>
      ),
    },
    { field: 'scheduledDate', headerName: 'Scheduled', sortable: true },
    {
      field: 'driver',
      headerName: 'Driver',
      render: (row) => (row.driver ? `${row.driver.firstName} ${row.driver.lastName}` : <Chip size="small" label="Unassigned" variant="outlined" />),
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      render: (row) => <Chip size="small" label={row.status.replace('_', ' ')} color={TRIP_STATUS_COLORS[row.status]} sx={{ textTransform: 'capitalize' }} />,
    },
    {
      field: 'actions',
      headerName: '',
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={() => setViewingTrip(row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {row.status === 'completed' && (
            <IconButton size="small" onClick={() => setInvoiceTrip(row)} title="View Invoice">
              <ReceiptIcon fontSize="small" color="primary" />
            </IconButton>
          )}
          {hasPermission('trips:update') && !isDriver && (
            <IconButton size="small" onClick={() => { setEditing(row); setFormOpen(true); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission('trips:assign') && !row.driver && row.canBeAssigned !== false && ['pending', 'assigned'].includes(row.status) && (
            <IconButton size="small" onClick={() => setAssignTarget(row)} title="Assign driver">
              <PersonAddIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission('trips:delete') && (
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
        await updateTrip.mutateAsync({ id: editing.id, payload: values });
        enqueueSnackbar('Trip updated successfully', { variant: 'success' });
      } else {
        await createTrip.mutateAsync(values);
        enqueueSnackbar('Trip created successfully', { variant: 'success' });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  const handleAssign = async (driverId) => {
    try {
      await assignTrip.mutateAsync({ id: assignTarget.id, driverId });
      enqueueSnackbar('Driver assigned successfully', { variant: 'success' });
      setAssignTarget(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to assign driver', { variant: 'error' });
    }
  };

  const handleAdvanceStatus = async (nextStatus, gps, extra) => {
    try {
      const updated = await updateStatus.mutateAsync({ id: viewingTrip.id, status: nextStatus, gps: gps || {}, extra: extra || {} });
      enqueueSnackbar('Trip status updated', { variant: 'success' });
      setViewingTrip(updated);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update trip status', { variant: 'error' });
    }
  };

  const handleSetEmergencyStop = async (active) => {
    try {
      const updated = await setEmergencyStop.mutateAsync({ id: viewingTrip.id, payload: { active } });
      enqueueSnackbar(active ? 'Emergency stop activated' : 'Emergency stop cleared', { variant: active ? 'warning' : 'success' });
      setViewingTrip(updated);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update emergency stop', { variant: 'error' });
    }
  };

  const handleReorderStops = async (orderedStops) => {
    try {
      const updated = await reorderStops.mutateAsync({ id: viewingTrip.id, stops: orderedStops });
      enqueueSnackbar('Stops reordered by nearest distance', { variant: 'success' });
      setViewingTrip(updated);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to reorder stops', { variant: 'error' });
    }
  };

  const handleUpdateDriverDetails = async (stopId, payload) => {
    try {
      const updated = await updateDriverDetails.mutateAsync({ tripId: viewingTrip.id, stopId, payload });
      enqueueSnackbar('Stop details saved', { variant: 'success' });
      setViewingTrip(updated);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to save stop details', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTrip.mutateAsync(deleteTarget.id);
      enqueueSnackbar('Trip deleted successfully', { variant: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete trip', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<LocalShippingIcon fontSize="medium" />}
        title={isDriver ? 'My Trips' : 'Trip Management'}
        description={
          isDriver
            ? 'Trips assigned to you, with delivery sequence and customer details.'
            : 'Create trips, assign drivers, and track delivery progress.'
        }
        actions={
          hasPermission('trips:create') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                if (isDriver) {
                  navigate('/trips/new');
                } else {
                  setEditing(null);
                  setFormOpen(true);
                }
              }}
            >
              New Trip
            </Button>
          )
        }
      />

      {/* Search + filter row — driver gets status chip pills, admin gets dropdown */}
      {isDriver ? (
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            placeholder="Search by trip number, origin or destination…"
            size="medium"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              sx: { borderRadius: 3 },
            }}
            sx={{ mb: 1.5 }}
          />
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'nowrap', gap: 0.75, overflowX: 'auto', pb: 0.5 }}>
            {[{ value: '', label: 'All' }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s.replace('_', ' ') }))].map(({ value: v, label }) => (
              <Chip
                key={v || 'all'}
                label={label}
                clickable
                onClick={() => { setPage(1); setStatus(v); }}
                color={status === v ? 'primary' : 'default'}
                variant={status === v ? 'filled' : 'outlined'}
                sx={{ textTransform: 'capitalize', fontWeight: status === v ? 700 : 500, fontSize: '0.8rem', height: 32, px: 0.5, flexShrink: 0 }}
              />
            ))}
          </Stack>
        </Box>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            placeholder="Search by trip number, origin or destination"
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
            sx={{ width: { xs: '100%', sm: 180 } }}
          >
            <MenuItem value="">All</MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                {s.replace('_', ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      {isDriver ? (
        <Box>
          {isLoading ? (
            <Stack spacing={2}>
              {[...Array(3)].map((_, i) => (
                <Card key={i} elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', pl: '4px', overflow: 'hidden' }}>
                  <Box sx={{ p: 2.5 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box><Skeleton width={48} height={11} sx={{ mb: 0.5 }} /><Skeleton width={130} height={22} /></Box>
                      <Skeleton width={82} height={24} sx={{ borderRadius: 3 }} />
                    </Stack>
                    <Skeleton height={16} sx={{ mb: 1.5 }} />
                    <Stack direction="row" spacing={2}><Skeleton width={110} height={12} /><Skeleton width={72} height={12} /></Stack>
                  </Box>
                  <Divider />
                  <Box sx={{ p: 1.5, px: 2.5 }}><Skeleton height={34} sx={{ borderRadius: 1.5 }} /></Box>
                </Card>
              ))}
            </Stack>
          ) : (data?.data || []).length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: { xs: 6, sm: 8 },
                px: 3,
                borderRadius: 3,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'action.hover',
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  mb: 2,
                  opacity: 0.12,
                }}
              >
                <LocalShippingOutlinedIcon sx={{ fontSize: 36, color: 'primary.main', opacity: 10 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
                {search || status ? 'No trips match your filter' : 'No trips yet'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, maxWidth: 280, mx: 'auto' }}>
                {search || status
                  ? 'Try adjusting your search or clearing the status filter.'
                  : 'Your assigned trips will appear here. You can also create a new trip to get started.'}
              </Typography>
              {!search && !status && hasPermission('trips:create') && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="large"
                  onClick={() => navigate('/trips/new')}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Create New Trip
                </Button>
              )}
              {(search || status) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => { setSearch(''); setStatus(''); setPage(1); }}
                  sx={{ borderRadius: 2 }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              {(data?.data || []).map((trip) => (
                <DriverTripCard
                  key={trip.id}
                  trip={trip}
                  onView={() => setViewingTrip(trip)}
                  onViewInvoice={(t) => setInvoiceTrip(t)}
                />
              ))}
            </Box>
          )}
          {(data?.meta?.total || 0) > pageSize && (
            <Stack sx={{ alignItems: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil((data?.meta?.total || 0) / pageSize)}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                size="small"
              />
            </Stack>
          )}
        </Box>
      ) : (
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
          emptyMessage="No trips found. Create your first trip to get started."
        />
      )}

      {!isDriver && (
        <TripFormDialog
          open={formOpen}
          trip={editing}
          submitting={createTrip.isPending || updateTrip.isPending}
          onSubmit={handleFormSubmit}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}

      <AssignDriverDialog
        open={!!assignTarget}
        trip={assignTarget}
        submitting={assignTrip.isPending}
        onSubmit={handleAssign}
        onClose={() => setAssignTarget(null)}
      />

      <TripDetailDrawer
        open={!!viewingTrip}
        trip={viewingTrip}
        onClose={() => setViewingTrip(null)}
        onAdvanceStatus={handleAdvanceStatus}
        onUpdateStopDetails={handleUpdateDriverDetails}
        onSetEmergencyStop={handleSetEmergencyStop}
        onReorderStops={handleReorderStops}
        canAdvance={hasPermission('trips:update') || isDriver}
        canEditStops={isDriver || hasPermission('trips:update')}
        isDriver={isDriver}
        advancing={updateStatus.isPending}
        savingStop={updateDriverDetails.isPending}
        settingEmergency={setEmergencyStop.isPending}
        reordering={reorderStops.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete trip"
        message={`Are you sure you want to delete trip ${deleteTarget?.tripNumber}?`}
        loading={deleteTrip.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <TripInvoiceDialog
        open={!!invoiceTrip}
        trip={invoiceTrip}
        onClose={() => setInvoiceTrip(null)}
      />
    </Box>
  );
}
