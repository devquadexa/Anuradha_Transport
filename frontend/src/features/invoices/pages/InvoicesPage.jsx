import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useTripsList } from '../../trips/hooks/useTrips';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [expandedTrip, setExpandedTrip] = useState(null);

  const params = {
    page,
    pageSize: 10,
    status: 'completed',
    approvalStatus: 'approved',
    sortBy: 'completedAt',
    sortOrder: 'DESC',
    ...(search && { search }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  };

  const { data, isLoading, isError } = useTripsList(params);

  const trips = data?.data || [];
  const meta = data?.meta || {};
  const totalPages = meta.totalPages || 1;

  const handleToggleExpand = (tripId) => {
    setExpandedTrip((prev) => (prev === tripId ? null : tripId));
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDateFromChange = (e) => {
    setDateFrom(e.target.value);
    setPage(1);
  };

  const handleDateToChange = (e) => {
    setDateTo(e.target.value);
    setPage(1);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <ReceiptIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Invoices
        </Typography>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by trip number..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <TextField
            size="small"
            type="date"
            label="From"
            value={dateFrom}
            onChange={handleDateFromChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={dateTo}
            onChange={handleDateToChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
        </Stack>
      </Paper>

      {/* Content */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load invoices. Please try again.
        </Alert>
      )}

      {!isLoading && !isError && trips.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No completed and approved trips found.</Typography>
        </Paper>
      )}

      {!isLoading && trips.length > 0 && (
        <Stack spacing={2}>
          {trips.map((trip) => (
            <TripInvoiceCard
              key={trip.id}
              trip={trip}
              expanded={expandedTrip === trip.id}
              onToggle={() => handleToggleExpand(trip.id)}
            />
          ))}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}

function TripInvoiceCard({ trip, expanded, onToggle }) {
  const invoiceRef = useRef(null);

  const handlePrint = useCallback(() => {
    const content = invoiceRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${trip.tripNumber}</title>
          <style>
            body { font-family: 'Roboto', Arial, sans-serif; padding: 32px; color: #333; }
            .invoice-header { border-bottom: 2px solid #1976d2; padding-bottom: 16px; margin-bottom: 16px; }
            .invoice-title { font-size: 24px; font-weight: 700; color: #1976d2; margin: 0; }
            .trip-number { font-size: 14px; color: #666; }
            .detail-row { margin-bottom: 6px; font-size: 14px; }
            .detail-label { font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 13px; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .total-row { font-weight: 700; background-color: #e3f2fd; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, [trip.tripNumber]);

  const totalMileage = (trip.stops || []).reduce(
    (sum, stop) => sum + (stop.driverMileage || 0),
    0
  );

  const driverName = trip.driver
    ? `${trip.driver.firstName} ${trip.driver.lastName}`
    : 'N/A';

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {/* Summary row */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ px: 2.5, py: 1.5, cursor: 'pointer' }}
        onClick={onToggle}
      >
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {trip.tripNumber}
            </Typography>
            <Chip
              label={trip.customer?.companyName || 'Unknown'}
              size="small"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              {trip.origin} → {trip.destination}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {trip.scheduledDate ? new Date(trip.scheduledDate).toLocaleDateString() : ''}
            {' • '}Driver: {driverName}
            {' • '}Total: {totalMileage.toFixed(1)} km
          </Typography>
        </Box>
        {expanded && (
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              handlePrint();
            }}
            title="Print Invoice"
          >
            <PrintIcon />
          </IconButton>
        )}
      </Stack>

      {/* Expanded invoice view */}
      <Collapse in={expanded}>
        <Divider />
        <Box ref={invoiceRef} sx={{ p: 3 }}>
          <Box className="invoice-header" sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 2, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography className="invoice-title" variant="h5" fontWeight={700} color="primary">
                INVOICE
              </Typography>
              <Typography className="trip-number" variant="body2" color="text.secondary" fontWeight={600}>
                {trip.tripNumber}
              </Typography>
            </Stack>
          </Box>

          <Stack spacing={0.75} sx={{ mb: 3 }}>
            <Typography className="detail-row" variant="body2">
              <Box component="span" className="detail-label" fontWeight={600}>Date: </Box>
              {trip.scheduledDate ? new Date(trip.scheduledDate).toLocaleDateString() : 'N/A'}
            </Typography>
            <Typography className="detail-row" variant="body2">
              <Box component="span" className="detail-label" fontWeight={600}>Customer: </Box>
              {trip.customer?.companyName || 'N/A'}
            </Typography>
            <Typography className="detail-row" variant="body2">
              <Box component="span" className="detail-label" fontWeight={600}>Driver: </Box>
              {driverName}
              {trip.driver?.vehicleNumber && (
                <>
                  {' | '}
                  <Box component="span" className="detail-label" fontWeight={600}>Vehicle: </Box>
                  {trip.driver.vehicleNumber}
                </>
              )}
            </Typography>
            <Typography className="detail-row" variant="body2">
              <Box component="span" className="detail-label" fontWeight={600}>Route: </Box>
              {trip.origin} → {trip.destination}
            </Typography>
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mileage</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Invoice Numbers</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(trip.stops || []).map((stop, index) => (
                  <TableRow key={stop.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{stop.locationName || 'N/A'}</TableCell>
                    <TableCell>
                      {stop.driverMileage != null ? `${stop.driverMileage.toFixed(1)} km` : '—'}
                    </TableCell>
                    <TableCell>
                      {stop.invoices && stop.invoices.length > 0
                        ? stop.invoices.join(', ')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="total-row" sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                    TOTAL MILEAGE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {totalMileage.toFixed(1)} km
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
    </Paper>
  );
}
