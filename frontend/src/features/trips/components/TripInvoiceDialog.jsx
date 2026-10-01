import { useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';

export default function TripInvoiceDialog({ open, trip, onClose }) {
  const invoiceRef = useRef(null);

  const handlePrint = useCallback(() => {
    const content = invoiceRef.current;
    if (!content || !trip) return;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    // Popup blocked — tell the user instead of silently failing.
    if (!printWindow) {
      // eslint-disable-next-line no-alert
      alert('Please allow pop-ups for this site to print the invoice.');
      return;
    }

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

    // Wait for the new document (and its content) to finish rendering before
    // invoking print, otherwise the dialog can open blank or the window closes
    // too early. Close after printing via onafterprint.
    const triggerPrint = () => {
      printWindow.focus();
      printWindow.print();
    };
    printWindow.onafterprint = () => printWindow.close();

    if (printWindow.document.readyState === 'complete') {
      setTimeout(triggerPrint, 250);
    } else {
      printWindow.onload = () => setTimeout(triggerPrint, 100);
      // Fallback in case onload doesn't fire for a written document.
      setTimeout(triggerPrint, 500);
    }
  }, [trip]);

  if (!trip) return null;

  const totalMileage = (trip.stops || []).reduce(
    (sum, stop) => sum + (stop.driverMileage || 0),
    0
  );

  const driverName = trip.driver
    ? `${trip.driver.firstName} ${trip.driver.lastName}`
    : 'N/A';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 3, pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Invoice — {trip.tripNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {trip.origin} → {trip.destination}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handlePrint} color="primary" title="Print Invoice">
            <PrintIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Divider sx={{ mx: 3, mt: 1 }} />

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Box ref={invoiceRef}>
          <Box sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 2, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight={700} color="primary">
                INVOICE
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {trip.tripNumber}
              </Typography>
            </Stack>
          </Box>

          <Stack spacing={0.75} sx={{ mb: 3 }}>
            <Typography variant="body2">
              <Box component="span" fontWeight={600}>Date: </Box>
              {trip.scheduledDate ? new Date(trip.scheduledDate).toLocaleDateString() : 'N/A'}
            </Typography>
            <Typography variant="body2">
              <Box component="span" fontWeight={600}>Customer: </Box>
              {trip.customer?.companyName || 'N/A'}
            </Typography>
            <Typography variant="body2">
              <Box component="span" fontWeight={600}>Driver: </Box>
              {driverName}
              {trip.driver?.vehicleNumber && (
                <> | <Box component="span" fontWeight={600}>Vehicle: </Box>{trip.driver.vehicleNumber}</>
              )}
            </Typography>
            <Typography variant="body2">
              <Box component="span" fontWeight={600}>Route: </Box>
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
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 700 }}>TOTAL MILEAGE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{totalMileage.toFixed(1)} km</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handlePrint} variant="outlined" startIcon={<PrintIcon />}>
          Print
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
