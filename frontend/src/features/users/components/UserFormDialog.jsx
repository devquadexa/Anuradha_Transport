import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DialogHeader from '../../../components/feedback/DialogHeader';
import { useRoles } from '../hooks/useUsers';

const DRIVER_ROLE_NAME = 'DRIVER';

export default function UserFormDialog({ open, user = null, submitting = false, onSubmit, onClose }) {
  const isEdit = !!user;
  const { data: roles = [] } = useRoles();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleId: '',
      status: 'active',
      password: '',
      nicNumber: '',
      licenseNumber: '',
      licenseExpiry: '',
      vehicleNumber: '',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      insuranceExpiry: '',
      address: '',
      driverNotes: '',
    },
  });

  const selectedRoleId = watch('roleId');
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isDriverRole = selectedRole?.name === DRIVER_ROLE_NAME;

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '',
          roleId: user.roleId,
          status: user.status,
          password: '',
          nicNumber: user.driver?.nicNumber || '',
          licenseNumber: user.driver?.licenseNumber || '',
          licenseExpiry: user.driver?.licenseExpiry?.slice(0, 10) || '',
          vehicleNumber: user.driver?.vehicleNumber || '',
          insuranceProvider: user.driver?.insuranceProvider || '',
          insurancePolicyNumber: user.driver?.insurancePolicyNumber || '',
          insuranceExpiry: user.driver?.insuranceExpiry?.slice(0, 10) || '',
          address: user.driver?.address || '',
          driverNotes: user.driver?.notes || '',
        });
      } else {
        reset({
          firstName: '', lastName: '', email: '', phone: '', roleId: '', status: 'active', password: '',
          nicNumber: '', licenseNumber: '', licenseExpiry: '', vehicleNumber: '',
          insuranceProvider: '', insurancePolicyNumber: '', insuranceExpiry: '', address: '', driverNotes: '',
        });
      }
    }
  }, [open, user, reset]);

  const submit = (values) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      roleId: values.roleId,
      status: values.status,
    };
    if (!isEdit) {
      payload.email = values.email;
      payload.password = values.password;
    }
    // Include driver fields if role is DRIVER
    if (isDriverRole) {
      payload.nicNumber = values.nicNumber;
      payload.licenseNumber = values.licenseNumber;
      payload.licenseExpiry = values.licenseExpiry;
      payload.vehicleNumber = values.vehicleNumber || null;
      payload.insuranceProvider = values.insuranceProvider || null;
      payload.insurancePolicyNumber = values.insurancePolicyNumber || null;
      payload.insuranceExpiry = values.insuranceExpiry || null;
      payload.address = values.address || null;
      payload.driverNotes = values.driverNotes || null;
    }
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogHeader
        icon={<PersonIcon />}
        title={isEdit ? 'Edit User' : 'Create User'}
        subtitle={isEdit ? 'Update user account details' : 'Set up a new user account'}
        onClose={onClose}
      />

      <DialogContent sx={{ px: 3, py: 3 }}>
        {/* Section: Personal Info */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
          Personal Information
        </Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="firstName" control={control} rules={{ required: 'Required' }}
              render={({ field }) => <TextField {...field} label="First Name" fullWidth error={!!errors.firstName} helperText={errors.firstName?.message} />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="lastName" control={control} rules={{ required: 'Required' }}
              render={({ field }) => <TextField {...field} label="Last Name" fullWidth error={!!errors.lastName} helperText={errors.lastName?.message} />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="phone" control={control}
              render={({ field }) => <TextField {...field} label="Phone" fullWidth />} />
          </Grid>
        </Grid>

        {/* Section: Account */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
          Account Settings
        </Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="email" control={control} rules={{ required: 'Required' }}
              render={({ field }) => <TextField {...field} label="Email" fullWidth disabled={isEdit} error={!!errors.email} helperText={errors.email?.message} />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="roleId" control={control} rules={{ required: 'Required' }}
              render={({ field }) => (
                <TextField {...field} select label="Role" fullWidth error={!!errors.roleId} helperText={errors.roleId?.message}>
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </TextField>
              )} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller name="status" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Status" fullWidth>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
              )} />
          </Grid>
          {!isEdit && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Required',
                  minLength: { value: 8, message: 'Min 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
                    message: 'Must include uppercase, lowercase, and a number',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="password"
                    label="Password"
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message || 'Min 8 chars, with uppercase, lowercase & a number'}
                  />
                )}
              />
            </Grid>
          )}
        </Grid>

        {/* Section: Driver Details (conditional) */}
        {isDriverRole && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
              Driver Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="nicNumber" control={control} rules={{ required: isDriverRole ? 'Required for drivers' : false }}
                  render={({ field }) => <TextField {...field} label="NIC Number" fullWidth error={!!errors.nicNumber} helperText={errors.nicNumber?.message} />} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="licenseNumber" control={control} rules={{ required: isDriverRole ? 'Required for drivers' : false }}
                  render={({ field }) => <TextField {...field} label="License Number" fullWidth error={!!errors.licenseNumber} helperText={errors.licenseNumber?.message} />} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="licenseExpiry" control={control} rules={{ required: isDriverRole ? 'Required for drivers' : false }}
                  render={({ field }) => <TextField {...field} type="date" label="License Expiry" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.licenseExpiry} helperText={errors.licenseExpiry?.message} />} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="vehicleNumber" control={control}
                  render={({ field }) => <TextField {...field} label="Vehicle Number" fullWidth />} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="insuranceProvider" control={control}
                  render={({ field }) => <TextField {...field} label="Insurance Provider" fullWidth placeholder="e.g., Ceylinco" />} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="insurancePolicyNumber" control={control}
                  render={({ field }) => <TextField {...field} label="Insurance Policy No." fullWidth />} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="insuranceExpiry" control={control}
                  render={({ field }) => <TextField {...field} type="date" label="Insurance Expiry" fullWidth InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="address" control={control}
                  render={({ field }) => <TextField {...field} label="Address" fullWidth />} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="driverNotes" control={control}
                  render={({ field }) => <TextField {...field} label="Notes" fullWidth multiline minRows={2} />} />
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit(submit)} variant="contained" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
