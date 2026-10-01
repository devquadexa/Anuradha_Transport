import { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Stack,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Collapse,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import { useSnackbar } from 'notistack';
import PageHeader from '../../../components/layout-elements/PageHeader';
import DataTable from '../../../components/data-table/DataTable';
import TripDetailDrawer from '../components/TripDetailDrawer';
import MenuItem from '@mui/material/MenuItem';
import { useTripsList, usePendingApprovals, useApproveTrip } from '../hooks/useTrips';
import { useActiveDrivers } from '../../drivers/hooks/useDrivers';
import { useAuth } from '../../../contexts/AuthContext';
import { tripsApi } from '../api/tripsApi';
import { exportTripReportsToExcel } from '../utils/tripReportExcel';

const APPROVAL_COLORS = { pending: 'warning', approved: 'success', rejected: 'error' };

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Human label for a "YYYY-MM" value, e.g. "August 2026".
function monthLabelFromValue(value) {
  if (!value) return 'All Months';
  const [y, m] = value.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

// Return { dateFrom, dateTo } (YYYY-MM-DD) for a given "YYYY-MM" value.
function monthToRange(value) {
  if (!value) return { dateFrom: undefined, dateTo: undefined };
  const [y, m] = value.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0); // day 0 of next month = last day of this month
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { dateFrom: iso(first), dateTo: iso(last) };
}

function getMileageDiffColor(driverMileage, gpsMileage) {
  if (driverMileage == null || gpsMileage == null) return 'default';
  const diff = Math.abs(driverMileage - gpsMileage);
  const pct = gpsMileage > 0 ? (diff / gpsMileage) * 100 : 0;
  if (pct <= 5) return 'success';
  if (pct <= 15) return 'warning';
  return 'error';
}

function getMileageDiffLabel(driverMileage, gpsMileage) {
  if (driverMileage == null || gpsMileage == null) return '—';
  const diff = (driverMileage - gpsMileage).toFixed(1);
  return diff > 0 ? `+${diff} km` : `${diff} km`;
}

export default function BusinessTripsPage() {
  const { user, hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const isDriver = user?.role === 'DRIVER';
  const canApprove = hasPermission('trips:update') && !isDriver;

  const [tab, setTab] = useState(0);

  // Completed trips state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('completedAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [viewingTrip, setViewingTrip] = useState(null);
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [month, setMonth] = useState(currentMonth); // defaults to current month
  const [rangeFrom, setRangeFrom] = useState(''); // explicit date range overrides month
  const [rangeTo, setRangeTo] = useState('');
  const [driverId, setDriverId] = useState(''); // vehicle/driver filter
  const [exporting, setExporting] = useState(false);
  const { data: activeDrivers = [] } = useActiveDrivers();
  const useRange = !!(rangeFrom || rangeTo);

  // Approvals state
  const [appPage, setAppPage] = useState(1);
  const [appPageSize, setAppPageSize] = useState(20);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedStop, setExpandedStop] = useState(null);

  // Data
  const monthRange = monthToRange(month);
  const dateFrom = useRange ? (rangeFrom || undefined) : monthRange.dateFrom;
  const dateTo = useRange ? (rangeTo || undefined) : monthRange.dateTo;
  const completedParams = {
    page,
    pageSize,
    search: search || undefined,
    status: 'completed',
    sortBy,
    sortOrder,
    dateFrom,
    dateTo,
    driverId: driverId || undefined,
  };
  const { data: completedData, isLoading: completedLoading } = useTripsList(completedParams);
  const { data: approvalsData, isLoading: approvalsLoading } = usePendingApprovals({ page: appPage, pageSize: appPageSize });
  const approveTrip = useApproveTrip();

  const pendingCount = approvalsData?.meta?.total || 0;

  // Completed trips columns
  const completedColumns = [
    { field: 'tripNumber', headerName: 'Trip #', sortable: true, render: (row) => <Typography variant="body2" fontWeight={700}>{row.tripNumber}</Typography> },
    { field: 'route', headerName: 'Route', render: (row) => (<Typography variant="body2">{row.origin} → {row.destination}</Typography>) },
    ...(!isDriver ? [{ field: 'driver', headerName: 'Driver', render: (row) => row.driver ? `${row.driver.firstName} ${row.driver.lastName}` : '—' }] : []),
    { field: 'completedAt', headerName: 'Completed', sortable: true, render: (row) => row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '—' },
    { field: 'approvalStatus', headerName: 'Approval', render: (row) => row.approvalStatus ? <Chip size="small" label={row.approvalStatus} color={APPROVAL_COLORS[row.approvalStatus]} sx={{ height: 22, fontSize: 11, textTransform: 'capitalize' }} /> : '—' },
    { field: 'totalMileage', headerName: 'Total KM', render: (row) => { const t = (row.stops || []).reduce((s, st) => s + (st.driverMileage || 0), 0); return t > 0 ? `${t.toFixed(1)} km` : '—'; } },
    { field: 'actions', headerName: '', render: (row) => <IconButton size="small" onClick={() => setViewingTrip(row)}><VisibilityIcon fontSize="small" /></IconButton> },
  ];

  // Approval columns
  const approvalColumns = [
    { field: 'tripNumber', headerName: 'Trip #', render: (row) => <Typography variant="body2" fontWeight={700}>{row.tripNumber}</Typography> },
    { field: 'route', headerName: 'Route', render: (row) => (<Typography variant="body2">{row.origin} → {row.destination}</Typography>) },
    { field: 'driver', headerName: 'Driver', render: (row) => row.driver ? `${row.driver.firstName} ${row.driver.lastName}` : '—' },
    { field: 'completedAt', headerName: 'Completed', render: (row) => row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '—' },
    { field: 'actions', headerName: '', render: (row) => (
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" onClick={() => setSelectedTrip(row)} title="Review"><VisibilityIcon fontSize="small" /></IconButton>
        <IconButton size="small" color="success" onClick={() => handleApprove(row.id)} disabled={approveTrip.isPending} title="Approve"><CheckCircleIcon fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => { setRejectTarget(row); setRejectDialogOpen(true); }} title="Reject"><CancelIcon fontSize="small" /></IconButton>
      </Stack>
    )},
  ];

  const handleSortChange = (field) => {
    if (sortBy === field) setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    else { setSortBy(field); setSortOrder('ASC'); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const monthLabel = useRange ? `${rangeFrom || '...'}_to_${rangeTo || '...'}` : monthLabelFromValue(month);
      const trips = await tripsApi.listAll({
        status: 'completed',
        search: search || undefined,
        sortBy: 'completedAt',
        sortOrder: 'ASC',
        dateFrom,
        dateTo,
        driverId: driverId || undefined,
      });
      if (!trips.length) {
        enqueueSnackbar('No completed trips found for the selected period.', { variant: 'info' });
        return;
      }
      await exportTripReportsToExcel(trips, { monthLabel });
      enqueueSnackbar(`Exported ${trips.length} trip(s) to Excel.`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || err.message || 'Failed to export', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleApprove = async (tripId) => {
    try {
      await approveTrip.mutateAsync({ id: tripId, payload: { approved: true } });
      enqueueSnackbar('Trip approved', { variant: 'success' });
      if (selectedTrip?.id === tripId) setSelectedTrip(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to approve', { variant: 'error' });
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await approveTrip.mutateAsync({ id: rejectTarget.id, payload: { approved: false, rejectionReason: rejectionReason || null } });
      enqueueSnackbar('Trip rejected', { variant: 'success' });
      setRejectDialogOpen(false); setRejectTarget(null); setRejectionReason('');
      if (selectedTrip?.id === rejectTarget.id) setSelectedTrip(null);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to reject', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<WorkHistoryIcon fontSize="medium" />}
        title="Reports"
        description="Completed trips, mileage details, and approval management."
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Completed Trips" />
        {canApprove && <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>Pending Approval</span>{pendingCount > 0 && <Chip size="small" label={pendingCount} color="warning" sx={{ height: 20, fontSize: 11 }} />}</Stack>} />}
      </Tabs>

      {/* Tab 0: Completed Trips */}
      {tab === 0 && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
            <TextField
              placeholder="Search by trip number, origin or destination"
              size="small"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              sx={{ width: { xs: '100%', sm: 420 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <TextField
              type="month"
              label="Month"
              size="small"
              value={month}
              disabled={useRange}
              onChange={(e) => { setPage(1); setMonth(e.target.value); }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: currentMonth }}
              sx={{ width: { xs: '100%', sm: 170 } }}
            />
            <TextField
              type="date"
              label="From"
              size="small"
              value={rangeFrom}
              onChange={(e) => { setPage(1); setRangeFrom(e.target.value); }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: { xs: '100%', sm: 160 } }}
            />
            <TextField
              type="date"
              label="To"
              size="small"
              value={rangeTo}
              onChange={(e) => { setPage(1); setRangeTo(e.target.value); }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: { xs: '100%', sm: 160 } }}
            />
            {(useRange || month !== currentMonth) && (
              <Button size="small" onClick={() => { setPage(1); setMonth(currentMonth); setRangeFrom(''); setRangeTo(''); }} sx={{ whiteSpace: 'nowrap' }}>
                Reset
              </Button>
            )}
            <TextField
              select
              label="Vehicle"
              size="small"
              value={driverId}
              onChange={(e) => { setPage(1); setDriverId(e.target.value); }}
              sx={{ width: { xs: '100%', sm: 180 } }}
            >
              <MenuItem value="">All Vehicles</MenuItem>
              {activeDrivers.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.vehicleNumber || d.fullName}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              color="success"
              startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />}
              onClick={handleExport}
              disabled={exporting}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </Stack>
          <DataTable
            columns={completedColumns}
            rows={completedData?.data || []}
            totalCount={completedData?.meta?.total || 0}
            page={page}
            pageSize={pageSize}
            sortBy={sortBy}
            sortOrder={sortOrder}
            isLoading={completedLoading}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            onSortChange={handleSortChange}
            emptyMessage="No completed trips yet."
          />
          <TripDetailDrawer open={!!viewingTrip} trip={viewingTrip} onClose={() => setViewingTrip(null)} canAdvance={false} canEditStops={false} isDriver={isDriver} />
        </>
      )}

      {/* Tab 1: Pending Approvals */}
      {tab === 1 && canApprove && (
        <>
          <DataTable
            columns={approvalColumns}
            rows={approvalsData?.data || []}
            totalCount={approvalsData?.meta?.total || 0}
            page={appPage}
            pageSize={appPageSize}
            isLoading={approvalsLoading}
            onPageChange={setAppPage}
            onPageSizeChange={(size) => { setAppPageSize(size); setAppPage(1); }}
            emptyMessage="No trips pending approval."
          />

          {/* Review Panel */}
          {selectedTrip && (
            <Paper sx={{ mt: 3, p: 3, borderRadius: 2 }} elevation={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>Review: {selectedTrip.tripNumber}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={() => handleApprove(selectedTrip.id)} disabled={approveTrip.isPending}>Approve</Button>
                  <Button variant="contained" color="error" size="small" startIcon={<CancelIcon />} onClick={() => { setRejectTarget(selectedTrip); setRejectDialogOpen(true); }}>Reject</Button>
                </Stack>
              </Stack>
              <Stack spacing={0.5} sx={{ mb: 3 }}>
                <Typography variant="body2"><strong>Route:</strong> {selectedTrip.origin} → {selectedTrip.destination}</Typography>
                <Typography variant="body2"><strong>Driver:</strong> {selectedTrip.driver ? `${selectedTrip.driver.firstName} ${selectedTrip.driver.lastName}` : '—'}</Typography>
                <Typography variant="body2"><strong>Completed:</strong> {selectedTrip.completedAt ? new Date(selectedTrip.completedAt).toLocaleString() : '—'}</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>Stop Mileage Comparison</Typography>
              <Stack spacing={1.5}>
                {(selectedTrip.stops || []).map((stop) => {
                  const isExpanded = expandedStop === stop.id;
                  const diffColor = getMileageDiffColor(stop.driverMileage, stop.gpsMileage);
                  return (
                    <Paper key={stop.id} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, cursor: 'pointer' }} onClick={() => setExpandedStop(isExpanded ? null : stop.id)}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={600}>{stop.sequenceNo}. {stop.locationName}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {stop.driverMileage != null && stop.gpsMileage != null && <Chip size="small" label={getMileageDiffLabel(stop.driverMileage, stop.gpsMileage)} color={diffColor} sx={{ height: 24, fontSize: 11, fontWeight: 700 }} />}
                          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </Stack>
                      </Stack>
                      <Collapse in={isExpanded}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Paper elevation={0} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, textAlign: 'center', border: '1px solid', borderColor: 'divider', bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(148,163,184,0.10)' : 'grey.50') }}>
                            <Typography variant="caption" color="text.secondary">Driver</Typography>
                            <Typography variant="h6" fontWeight={700}>{stop.driverMileage != null ? `${stop.driverMileage} km` : '—'}</Typography>
                          </Paper>
                          <Paper elevation={0} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, textAlign: 'center', border: '1px solid', borderColor: 'divider', bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(34,197,94,0.14)' : 'success.50') }}>
                            <Stack direction="row" spacing={0.5} justifyContent="center"><GpsFixedIcon sx={{ fontSize: 14 }} color="success" /><Typography variant="caption" color="text.secondary">GPS</Typography></Stack>
                            <Typography variant="h6" fontWeight={700}>{stop.gpsMileage != null ? `${stop.gpsMileage} km` : '—'}</Typography>
                          </Paper>
                          <Paper elevation={0} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, textAlign: 'center', border: '1px solid', borderColor: 'divider', bgcolor: (t) => { const dark = t.palette.mode === 'dark'; if (diffColor === 'error') return dark ? 'rgba(220,38,38,0.16)' : 'error.50'; if (diffColor === 'warning') return dark ? 'rgba(245,158,11,0.16)' : 'warning.50'; return dark ? 'rgba(34,197,94,0.14)' : 'success.50'; } }}>
                            <Typography variant="caption" color="text.secondary">Diff</Typography>
                            <Typography variant="h6" fontWeight={700} color={`${diffColor}.main`}>{getMileageDiffLabel(stop.driverMileage, stop.gpsMileage)}</Typography>
                          </Paper>
                        </Stack>
                      </Collapse>
                    </Paper>
                  );
                })}
              </Stack>
            </Paper>
          )}

          {/* Reject Dialog */}
          <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Reject Trip</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>Provide a reason for rejecting trip <strong>{rejectTarget?.tripNumber}</strong>.</Typography>
              <TextField label="Rejection Reason" multiline rows={3} fullWidth value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. Mileage discrepancy exceeds acceptable threshold" />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setRejectDialogOpen(false); setRejectionReason(''); }}>Cancel</Button>
              <Button variant="contained" color="error" onClick={handleReject} disabled={approveTrip.isPending}>{approveTrip.isPending ? 'Rejecting...' : 'Reject Trip'}</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}
