import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Box,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LinkIcon from '@mui/icons-material/Link';
import BadgeIcon from '@mui/icons-material/Badge';
import DialogHeader from '../../../components/feedback/DialogHeader';
import { useLinkableDriverUsers } from '../hooks/useDrivers';

const driverSchema = Joi.object({
  userId: Joi.number().integer().positive().allow(null, ''),
  nicNumber: Joi.string().trim().min(5).max(20).required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  licenseNumber: Joi.string().trim().min(3).max(50).required(),
  licenseExpiry: Joi.string().required().messages({ 'string.empty': 'License expiry date is required' }),
  vehicleNumber: Joi.string().trim().allow('').max(30),
  insuranceProvider: Joi.string().trim().allow('').max(150),
  insurancePolicyNumber: Joi.string().trim().allow('').max(100),
  insuranceExpiry: Joi.string().allow(''),
  address: Joi.string().trim().allow('').max(255),
  status: Joi.string().valid('active', 'inactive', 'on_leave', 'suspended').required(),
  notes: Joi.string().trim().allow('').max(2000),
});

const DEFAULTS = {
  userId: '',
  nicNumber: '',
  phone: '',
  licenseNumber: '',
  licenseExpiry: '',
  vehicleNumber: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  insuranceExpiry: '',
  address: '',
  status: 'active',
  notes: '',
};

// Days until a date (negative if past). Used for the expiry warnings.
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// Inline warning shown under an expiry date field.
function ExpiryHint({ days, label }) {
  if (days == null) return null;
  if (days < 0) {
    return (
      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'error.main', fontWeight: 600 }}>
        {label} expired {Math.abs(days)} day{Math.abs(days) === 1 ? '' : 's'} ago
      </Typography>
    );
  }
  if (days <= 30) {
    return (
      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'warning.main', fontWeight: 600 }}>
        {label} expires in {days} day{days === 1 ? '' : 's'}
      </Typography>
    );
  }
  return null;
}

export default function DriverFormDialog({ open, driver = null, submitting = false, onSubmit, onClose }) {
  const isEdit = !!driver;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data: linkableUsers = [] } = useLinkableDriverUsers();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: joiResolver(driverSchema), defaultValues: DEFAULTS });

  const licenseExpiryVal = watch('licenseExpiry');
  const insuranceExpiryVal = watch('insuranceExpiry');
  const licenseDays = daysUntil(licenseExpiryVal);
  const insuranceDays = daysUntil(insuranceExpiryVal);

  useEffect(() => {
    if (open) {
      reset(driver
        ? {
            ...DEFAULTS,
            ...driver,
            userId: driver.userId || '',
            licenseExpiry: driver.licenseExpiry?.slice(0, 10) || '',
            insuranceProvider: driver.insuranceProvider || '',
            insurancePolicyNumber: driver.insurancePolicyNumber || '',
            insuranceExpiry: driver.insuranceExpiry?.slice(0, 10) || '',
          }
        : DEFAULTS);
    }
  }, [open, driver, reset]);

  // Include the currently linked user in the dropdown options if editing
  const userOptions = [...linkableUsers];
  if (isEdit && driver?.userId) {
    const alreadyInList = userOptions.some((u) => u.id === driver.userId);
    if (!alreadyInList) {
      userOptions.unshift({ id: driver.userId, firstName: driver.firstName, lastName: driver.lastName, email: '(currently linked)' });
    }
  }

  const handleFormSubmit = (values) => {
    // Pull firstName/lastName from the selected user if linked
    const selectedUser = userOptions.find((u) => u.id === values.userId);
    const payload = {
      ...values,
      userId: values.userId || null,
      firstName: selectedUser ? selectedUser.firstName : (driver?.firstName || 'Driver'),
      lastName: selectedUser ? selectedUser.lastName : (driver?.lastName || ''),
    };
    onSubmit(payload);
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
          {title}
        </Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogHeader
        icon={<BadgeIcon />}
        title={isEdit ? 'Edit Driver' : 'New Driver'}
        subtitle={isEdit ? 'Update driver information below' : 'Fill in the details to register a new driver'}
        onClose={onClose}
      />

      <DialogContent sx={{ px: 3, py: 3, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {/* Section: Link User Account */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader icon={LinkIcon} title="Link User Account" subtitle="Link to a user account so the driver can log in and see trips" />
          <Controller
            name="userId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="User Account (optional)"
                fullWidth
                size="small"
                helperText="Select the user account this driver will log in with"
              >
                <MenuItem value="">— No user account linked —</MenuItem>
                {userOptions.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Paper>

        {/* Section: NIC & Phone */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader icon={PersonIcon} title="Identification & Contact" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="nicNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="NIC Number"
                    fullWidth
                    size="small"
                    disabled={isEdit}
                    error={!!errors.nicNumber}
                    helperText={errors.nicNumber?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    fullWidth
                    size="small"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    placeholder="+94 71 234 5678"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Status" fullWidth size="small">
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="on_leave">On Leave</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section: License & Vehicle */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader icon={DirectionsCarIcon} title="License & Vehicle" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="licenseNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="License Number"
                    fullWidth
                    size="small"
                    error={!!errors.licenseNumber}
                    helperText={errors.licenseNumber?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="licenseExpiry"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="License Expiry"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.licenseExpiry}
                    helperText={errors.licenseExpiry?.message}
                  />
                )}
              />
              <ExpiryHint days={licenseDays} label="License" />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="vehicleNumber"
                control={control}
                render={({ field }) => <TextField {...field} label="Vehicle Number" fullWidth size="small" placeholder="e.g., ABC-1234" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="insuranceProvider"
                control={control}
                render={({ field }) => <TextField {...field} label="Insurance Provider" fullWidth size="small" placeholder="e.g., Ceylinco" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="insurancePolicyNumber"
                control={control}
                render={({ field }) => <TextField {...field} label="Insurance Policy No." fullWidth size="small" placeholder="Policy number" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="insuranceExpiry"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Insurance Expiry"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              <ExpiryHint days={insuranceDays} label="Insurance" />
            </Grid>
          </Grid>
        </Paper>

        {/* Section: Address & Notes */}
        <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader icon={LocationOnIcon} title="Address & Notes" />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => <TextField {...field} label="Address" fullWidth size="small" placeholder="Home address" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => <TextField {...field} label="Notes" fullWidth multiline minRows={3} size="small" />}
              />
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} variant="outlined" fullWidth={isMobile}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(handleFormSubmit)} variant="contained" disabled={submitting} fullWidth={isMobile}>
          {submitting ? 'Saving...' : isEdit ? 'Update Driver' : 'Create Driver'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
