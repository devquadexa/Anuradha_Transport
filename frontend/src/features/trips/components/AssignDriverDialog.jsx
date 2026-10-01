import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Box,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useActiveDrivers } from '../../drivers/hooks/useDrivers';

export default function AssignDriverDialog({ open, trip, submitting = false, onSubmit, onClose }) {
  const { data: drivers = [] } = useActiveDrivers();
  const [driverId, setDriverId] = useState('');

  useEffect(() => {
    if (open) setDriverId(trip?.driverId || '');
  }, [open, trip]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 3, pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Assign Driver
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trip {trip?.tripNumber}: {trip?.origin} → {trip?.destination}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mx: 3, mt: 1 }} />

      <DialogContent sx={{ px: 3, py: 3 }}>
        <TextField
          select
          label="Select Driver"
          fullWidth
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
        >
          {drivers.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.fullName} — {d.vehicleNumber || 'No vehicle'}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button variant="contained" disabled={!driverId || submitting} onClick={() => onSubmit(driverId)}>
          {submitting ? 'Assigning...' : 'Assign Driver'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
