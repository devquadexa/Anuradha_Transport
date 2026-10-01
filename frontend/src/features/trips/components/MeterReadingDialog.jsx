import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import DialogHeader from '../../../components/feedback/DialogHeader';

/**
 * Prompts the driver for the vehicle's current meter (odometer) reading before
 * showing the route. Used at Start Trip and before each stop's route.
 */
export default function MeterReadingDialog({ open, locationName, submitting = false, onSubmit, onClose }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  const num = Number(value);
  const valid = value !== '' && !Number.isNaN(num) && num >= 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogHeader
        icon={<SpeedIcon />}
        title="Vehicle Meter Reading"
        subtitle={locationName ? `Before heading to ${locationName}` : 'Enter the current odometer reading'}
        onClose={onClose}
      />
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Enter the vehicle's current meter reading (km) to continue and view the route.
          </Typography>
          <TextField
            autoFocus
            label="Meter Reading (km)"
            type="number"
            fullWidth
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputProps={{ min: 0, step: '0.01' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && valid && !submitting) onSubmit(num);
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} variant="outlined">Cancel</Button>
        <Button
          onClick={() => onSubmit(num)}
          variant="contained"
          disabled={!valid || submitting}
        >
          {submitting ? 'Saving...' : 'Save & View Route'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
