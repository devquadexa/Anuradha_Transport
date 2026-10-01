import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Typography,
  IconButton,
  Box,
  Divider,
  Paper,
  Autocomplete,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RouteIcon from '@mui/icons-material/Route';
import NotesIcon from '@mui/icons-material/Notes';
import StraightenIcon from '@mui/icons-material/Straighten';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import DialogHeader from '../../../components/feedback/DialogHeader';
import { useCustomersList } from '../../customers/hooks/useCustomers';
import { useActiveLocations } from '../../locations/hooks/useLocations';
import { useActiveDrivers } from '../../drivers/hooks/useDrivers';
import { getDrivingDistanceKm } from '../../../utils/gps';

const stopSchema = Joi.object({
  locationId: Joi.number().integer().positive().allow(null, ''),
  locationName: Joi.string().trim().min(1).max(255).required().messages({ 'string.empty': 'Location is required' }),
});

const tripSchema = Joi.object({
  // Derived automatically from the selected locations; not shown in the form.
  customerId: Joi.number().integer().positive().allow(null, ''),
  driverId: Joi.number().integer().positive().allow(null, ''),
  originLocationId: Joi.number().integer().positive().allow(null, ''),
  origin: Joi.string().trim().min(1).max(255).required(),
  endPoint: Joi.string().trim().allow('').max(255),
  scheduledDate: Joi.string().required().messages({ 'string.empty': 'Scheduled date is required' }),
  scheduledTime: Joi.string().trim().allow(''),
  cargoDescription: Joi.string().trim().allow('').max(255),
  remarks: Joi.string().trim().allow('').max(2000),
  stops: Joi.array().items(stopSchema).min(1).required().messages({ 'array.min': 'Add at least one destination location' }),
});

const DEFAULTS = {
  customerId: '',
  driverId: '',
  originLocationId: '',
  origin: '',
  endPoint: '',
  scheduledDate: '',
  scheduledTime: '',
  cargoDescription: '',
  remarks: '',
  stops: [{ locationId: '', locationName: '' }],
};

// Row showing a document's expiry date, days left, and active/inactive status.
function ExpiryRow({ icon, label, date, days }) {
  // "active" while the document is still valid (days >= 0), else "inactive".
  const hasDate = date != null && date !== '';
  const isActive = hasDate && days != null && days >= 0;
  const expiringSoon = isActive && days <= 30;

  let statusColor = 'default';
  let statusLabel = 'Unknown';
  if (hasDate) {
    if (!isActive) {
      statusColor = 'error';
      statusLabel = 'Inactive';
    } else if (expiringSoon) {
      statusColor = 'warning';
      statusLabel = 'Active';
    } else {
      statusColor = 'success';
      statusLabel = 'Active';
    }
  }

  let daysText = '—';
  if (hasDate && days != null) {
    daysText = days >= 0 ? `${days} day${days === 1 ? '' : 's'} left` : `expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 66 }}>
        {label}:
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {hasDate ? `${date} • ${daysText}` : 'Not set'}
      </Typography>
      <Chip
        size="small"
        label={statusLabel}
        color={statusColor}
        variant={statusColor === 'success' ? 'outlined' : 'filled'}
        sx={{ height: 18, fontSize: 9, fontWeight: 700, ml: 'auto' }}
      />
    </Stack>
  );
}

export default function TripFormDialog({ open, trip = null, submitting = false, onSubmit, onClose }) {
  const isEdit = !!trip;
  const { data: customersData } = useCustomersList({ page: 1, pageSize: 100, status: 'active' });
  const customers = customersData?.data || [];
  const { data: allLocations = [] } = useActiveLocations();
  const { data: drivers = [] } = useActiveDrivers();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: joiResolver(tripSchema), defaultValues: DEFAULTS });

  const { fields, append, remove } = useFieldArray({ control, name: 'stops' });

  // Locations can now be picked from ANY customer, not just the selected one.
  const locations = allLocations;

  const watchedDriverId = watch('driverId');
  const watchedOrigin = watch('origin');
  const watchedEndPoint = watch('endPoint');
  const watchedStops = watch('stops');
  const selectedDriver = drivers.find((d) => d.id === watchedDriverId) || null;

  // Auto-generated trip name: "Origin → Final Destination [→ End Point]".
  const finalDestination = (watchedStops || []).filter((s) => s?.locationName?.trim()).slice(-1)[0]?.locationName || '';
  const autoTripName = watchedOrigin && finalDestination
    ? `${watchedOrigin} → ${finalDestination}${watchedEndPoint ? ` → ${watchedEndPoint}` : ''}`
    : '';

  const [distances, setDistances] = useState([]); 
  const [totalDistance, setTotalDistance] = useState(null);
  const [selectedOriginLoc, setSelectedOriginLoc] = useState(null);
  const [selectedStopLocs, setSelectedStopLocs] = useState([]);

  // Calculate distances when selected locations change
  useEffect(() => {
    const calcDistances = async () => {
      const points = [];

      // Origin
      if (selectedOriginLoc) {
        points.push({ lat: selectedOriginLoc.latitude, lng: selectedOriginLoc.longitude });
      }

      // Stops
      selectedStopLocs.forEach((loc) => {
        if (loc) {
          points.push({ lat: loc.latitude, lng: loc.longitude });
        } else {
          points.push(null);
        }
      });

      // Need at least 2 points
      if (points.filter(Boolean).length < 2) {
        setDistances([]);
        setTotalDistance(null);
        return;
      }

      const dists = [];
      let total = 0;
      for (let i = 1; i < points.length; i++) {
        if (points[i - 1] && points[i]) {
          const km = await getDrivingDistanceKm(
            points[i - 1].lat, points[i - 1].lng,
            points[i].lat, points[i].lng
          );
          dists.push(km);
          total += km;
        } else {
          dists.push(null);
        }
      }

      setDistances(dists);
      setTotalDistance(total > 0 ? Math.round(total * 100) / 100 : null);
    };

    calcDistances();
  }, [selectedOriginLoc, selectedStopLocs]);

  useEffect(() => {
    if (open) {
      setSelectedOriginLoc(null);
      setSelectedStopLocs([]);
      setDistances([]);
      setTotalDistance(null);
      reset(
        trip
          ? {
              customerId: trip.customerId,
              driverId: trip.driverId || '',
              originLocationId: '',
              origin: trip.origin,
              endPoint: trip.endPoint || '',
              scheduledDate: trip.scheduledDate,
              scheduledTime: trip.scheduledTime?.slice(0, 5) || '',
              cargoDescription: trip.cargoDescription || '',
              remarks: trip.remarks || '',
              stops: (trip.stops || []).map((s) => ({
                locationId: s.locationId || '',
                locationName: s.locationName,
              })),
            }
          : DEFAULTS
      );
    }
  }, [open, trip, reset]);

  const handleFormSubmit = (values) => {
    const lastStop = values.stops[values.stops.length - 1];

    // Ensure a customer is set: derive from a selected location, else fall
    // back to the first active customer (backend requires customerId).
    let customerId = values.customerId;
    if (!customerId) {
      const derived = [selectedOriginLoc, ...selectedStopLocs].find((l) => l?.customerId)?.customerId;
      customerId = derived || customers[0]?.id || null;
    }

    const payload = {
      ...values,
      customerId,
      destination: lastStop.locationName,
      driverId: values.driverId || null,
    };
    // Remove frontend-only fields
    delete payload.originLocationId;
    payload.stops = payload.stops.map((s) => ({
      locationName: s.locationName,
      locationId: s.locationId || null,
    }));
    onSubmit(payload);
  };

  // Customer is no longer chosen manually — derive it from the first picked
  // location that belongs to a customer (origin first, then stops).
  const applyDerivedCustomer = (loc) => {
    if (loc?.customerId && !watch('customerId')) {
      setValue('customerId', loc.customerId, { shouldValidate: true });
    }
  };

  const handleOriginSelect = (loc) => {
    if (loc) {
      setValue('origin', loc.name, { shouldValidate: true });
      setValue('originLocationId', loc.id);
      setSelectedOriginLoc(loc);
      applyDerivedCustomer(loc);
    }
  };

  const handleStopSelect = (index, loc) => {
    if (loc) {
      setValue(`stops.${index}.locationName`, loc.name, { shouldValidate: true });
      setValue(`stops.${index}.locationId`, loc.id);
      setSelectedStopLocs((prev) => {
        const updated = [...prev];
        updated[index] = loc;
        return updated;
      });
      applyDerivedCustomer(loc);
    }
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
        icon={<LocalShippingIcon />}
        title={isEdit ? `Edit Trip ${trip?.tripNumber}` : 'New Trip'}
        subtitle={isEdit ? 'Update trip details below' : 'Fill in the details to create a new trip'}
        onClose={onClose}
      />

      <DialogContent sx={{ px: 3, py: 3, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {/* Section: Basic Trip Info */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader icon={LocalShippingIcon} title="Trip Information" />
          <Stack spacing={2}>
            {/* Driver selection (step 1) */}
            <Controller
              name="driverId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Driver"
                  fullWidth
                  size="small"
                  error={!!errors.driverId}
                  helperText={errors.driverId?.message}
                >
                  <MenuItem value="">
                    <em>Unassigned (assign later)</em>
                  </MenuItem>
                  {drivers.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.fullName} — {d.vehicleNumber || 'No vehicle'}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Driver details auto-populated from selection (step 2) */}
            {selectedDriver && (
              <Paper elevation={0} sx={{ p: 1.75, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight={700}>{selectedDriver.fullName}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DirectionsCarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Vehicle: {selectedDriver.vehicleNumber || '—'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {selectedDriver.phone || '—'}
                      {selectedDriver.licenseNumber ? ` • Licence: ${selectedDriver.licenseNumber}` : ''}
                    </Typography>
                  </Stack>

                  <Divider sx={{ my: 0.25 }} />

                  {/* License expiry */}
                  <ExpiryRow
                    icon={<BadgeOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                    label="License"
                    date={selectedDriver.licenseExpiry}
                    days={selectedDriver.licenseDaysLeft}
                  />

                  {/* Insurance expiry */}
                  <ExpiryRow
                    icon={<VerifiedUserOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                    label="Insurance"
                    date={selectedDriver.insuranceExpiry}
                    days={selectedDriver.insuranceDaysLeft}
                  />
                </Stack>
              </Paper>
            )}

            <Controller
              name="origin"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  freeSolo
                  options={locations}
                  getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
                  inputValue={field.value}
                  onInputChange={(_, val) => field.onChange(val)}
                  onChange={(_, val) => { if (val && typeof val === 'object') handleOriginSelect(val); }}
                  renderOption={(props, opt) => (
                    <li {...props} key={opt.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{opt.name}</Typography>
                        {opt.customer && <Typography variant="caption" color="text.secondary">{opt.customer.companyName}</Typography>}
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Starting Point (Origin)"
                      size="small"
                      error={!!errors.origin}
                      helperText={errors.origin?.message}
                      placeholder="Search saved locations or type manually"
                    />
                  )}
                />
              )}
            />

            {/* End Point — where the trip finishes (e.g. return to depot) */}
            <Controller
              name="endPoint"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  freeSolo
                  options={locations}
                  getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
                  inputValue={field.value}
                  onInputChange={(_, val) => field.onChange(val)}
                  onChange={(_, val) => { if (val && typeof val === 'object') field.onChange(val.name); }}
                  renderOption={(props, opt) => (
                    <li {...props} key={opt.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{opt.name}</Typography>
                        {opt.customer && <Typography variant="caption" color="text.secondary">{opt.customer.companyName}</Typography>}
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="End Point (optional)"
                      size="small"
                      placeholder="Where the trip finishes, e.g. depot / warehouse"
                      helperText="The trip is considered ended once the vehicle reaches this point"
                    />
                  )}
                />
              )}
            />

            {/* Auto-generated trip name from origin -> final destination */}
            <TextField
              label="Trip Name (auto)"
              fullWidth
              size="small"
              value={autoTripName}
              placeholder="Set origin and destination to generate"
              InputProps={{ readOnly: true }}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Generated automatically from start → end point"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="scheduledDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Scheduled Date"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={!!errors.scheduledDate}
                    helperText={errors.scheduledDate?.message}
                    sx={{ '& .MuiInputLabel-root': { bgcolor: 'background.paper', px: 0.5 } }}
                  />
                )}
              />
              <Controller
                name="scheduledTime"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="time"
                    label="Scheduled Time"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ '& .MuiInputLabel-root': { bgcolor: 'background.paper', px: 0.5 } }}
                  />
                )}
              />
            </Stack>
            <Controller
              name="cargoDescription"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Cargo Description" fullWidth size="small" placeholder="Describe the cargo/items" />
              )}
            />
          </Stack>
        </Paper>

        {/* Section: Route Locations */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                <RouteIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                  Route Locations
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add locations from any customer. Last one is the final destination. Shortest path is auto-calculated.
                </Typography>
              </Box>
            </Box>
            <Button size="small" startIcon={<AddIcon />} onClick={() => append({ locationId: '', locationName: '' })}>
              Add
            </Button>
          </Box>

          {errors.stops?.message && (
            <Typography variant="caption" color="error" sx={{ mb: 1.5, display: 'block' }}>
              {errors.stops.message}
            </Typography>
          )}

          <Stack spacing={1}>
            {fields.map((item, index) => (
              <Box key={item.id}>
                {/* Distance from previous location */}
                {distances[index] != null && (
                  <Stack direction="row" alignItems="center" justifyContent="center" sx={{ py: 0.5 }}>
                    <Chip
                      icon={<StraightenIcon />}
                      label={`${distances[index]} km`}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ fontSize: 11, height: 24 }}
                    />
                  </Stack>
                )}
                <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      {index === fields.length - 1 ? `Location #${index + 1} (Final Destination)` : `Location #${index + 1}`}
                    </Typography>
                    {fields.length > 1 && (
                      <IconButton size="small" onClick={() => remove(index)} color="error">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                  <Controller
                    name={`stops.${index}.locationName`}
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        freeSolo
                        options={locations}
                        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
                        inputValue={field.value}
                        onInputChange={(_, val) => field.onChange(val)}
                        onChange={(_, val) => { if (val && typeof val === 'object') handleStopSelect(index, val); }}
                        renderOption={(props, opt) => (
                          <li {...props} key={opt.id}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{opt.name}</Typography>
                              {opt.customer && <Typography variant="caption" color="text.secondary">{opt.customer.companyName}</Typography>}
                            </Box>
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Location"
                            size="small"
                            error={!!errors.stops?.[index]?.locationName}
                            helperText={errors.stops?.[index]?.locationName?.message}
                            placeholder="Search saved locations or type manually"
                          />
                        )}
                      />
                    )}
                  />
                </Box>
              </Box>
            ))}
          </Stack>

          {/* Total distance */}
          {totalDistance != null && (
            <Paper elevation={0} sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light', textAlign: 'center' }}>
              <Typography variant="body2" fontWeight={700} color="info.main">
                Total Route Distance: {totalDistance} km
              </Typography>
            </Paper>
          )}
        </Paper>

        {/* Section: Additional Notes */}
        <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader icon={NotesIcon} title="Remarks" />
          <Controller
            name="remarks"
            control={control}
            render={({ field }) => <TextField {...field} label="Remarks" fullWidth multiline minRows={3} size="small" />}
          />
        </Paper>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} variant="outlined" fullWidth={isMobile}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(handleFormSubmit)} variant="contained" disabled={submitting} fullWidth={isMobile}>
          {submitting ? 'Saving...' : isEdit ? 'Update Trip' : 'Create Trip'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
