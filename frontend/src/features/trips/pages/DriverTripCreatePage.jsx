import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import {
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  IconButton,
  Paper,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RouteIcon from '@mui/icons-material/Route';
import NotesIcon from '@mui/icons-material/Notes';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import StraightenIcon from '@mui/icons-material/Straighten';
import { useSnackbar } from 'notistack';
import { useActiveLocations } from '../../locations/hooks/useLocations';
import { useCreateTrip } from '../hooks/useTrips';
import { getDrivingDistanceKm } from '../../../utils/gps';

const stopSchema = Joi.object({
  locationId: Joi.number().integer().positive().allow(null, ''),
  locationName: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Location is required',
    'any.required': 'Location is required',
  }),
});

const schema = Joi.object({
  origin: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Starting point is required',
    'any.required': 'Starting point is required',
  }),
  endPoint: Joi.string().trim().allow('').max(255),
  scheduledDate: Joi.string().required().messages({
    'string.empty': 'Scheduled date is required',
    'any.required': 'Scheduled date is required',
  }),
  scheduledTime: Joi.string().trim().allow(''),
  cargoDescription: Joi.string().trim().allow('').max(255),
  remarks: Joi.string().trim().allow('').max(2000),
  stops: Joi.array().items(stopSchema).min(1).required().messages({
    'array.min': 'Add at least one delivery location',
  }),
});

const DEFAULTS = {
  origin: '',
  endPoint: '',
  scheduledDate: '',
  scheduledTime: '',
  cargoDescription: '',
  remarks: '',
  stops: [{ locationId: '', locationName: '' }],
};

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
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
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

export default function DriverTripCreatePage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { data: allLocations = [], isLoading: locationsLoading } = useActiveLocations();
  const createTrip = useCreateTrip();

  const [selectedOriginLoc, setSelectedOriginLoc] = useState(null);
  const [selectedStopLocs, setSelectedStopLocs] = useState([]);
  const [distances, setDistances] = useState([]);
  const [totalDistance, setTotalDistance] = useState(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: joiResolver(schema), defaultValues: DEFAULTS });

  const { fields, append, remove } = useFieldArray({ control, name: 'stops' });

  const watchedOrigin = watch('origin');
  const watchedEndPoint = watch('endPoint');
  const watchedStops = watch('stops');

  const finalStopName =
    (watchedStops || []).filter((s) => s?.locationName?.trim()).slice(-1)[0]?.locationName || '';
  const routePreview =
    watchedOrigin && finalStopName
      ? `${watchedOrigin} → ${finalStopName}${watchedEndPoint ? ` → ${watchedEndPoint}` : ''}`
      : '';

  // Derive customer from selected locations
  const derivedCustomerId = useMemo(() => {
    const locs = [selectedOriginLoc, ...selectedStopLocs].filter(Boolean);
    return locs.find((l) => l.customerId)?.customerId || null;
  }, [selectedOriginLoc, selectedStopLocs]);

  const derivedCustomer = useMemo(() => {
    if (!derivedCustomerId) return null;
    const locs = [selectedOriginLoc, ...selectedStopLocs].filter(Boolean);
    return locs.find((l) => l.customerId === derivedCustomerId)?.customer || null;
  }, [derivedCustomerId, selectedOriginLoc, selectedStopLocs]);

  // Calculate driving distances between consecutive location picks
  useEffect(() => {
    const calc = async () => {
      const points = [];
      if (selectedOriginLoc?.latitude && selectedOriginLoc?.longitude) {
        points.push({ lat: selectedOriginLoc.latitude, lng: selectedOriginLoc.longitude });
      }
      selectedStopLocs.forEach((loc) => {
        if (loc?.latitude && loc?.longitude) {
          points.push({ lat: loc.latitude, lng: loc.longitude });
        } else {
          points.push(null);
        }
      });

      if (points.filter(Boolean).length < 2) {
        setDistances([]);
        setTotalDistance(null);
        return;
      }

      try {
        const dists = [];
        let total = 0;
        for (let i = 1; i < points.length; i++) {
          if (points[i - 1] && points[i]) {
            const km = await getDrivingDistanceKm(
              points[i - 1].lat,
              points[i - 1].lng,
              points[i].lat,
              points[i].lng
            );
            dists.push(km);
            total += km;
          } else {
            dists.push(null);
          }
        }
        setDistances(dists);
        setTotalDistance(total > 0 ? Math.round(total * 100) / 100 : null);
      } catch {
        // Distance calculation is best-effort; silently skip on failure.
      }
    };
    calc();
  }, [selectedOriginLoc, selectedStopLocs]);

  const handleOriginSelect = (loc) => {
    if (!loc) return;
    setValue('origin', loc.name, { shouldValidate: true });
    setSelectedOriginLoc(loc);
  };

  const handleStopSelect = (index, loc) => {
    if (!loc) return;
    setValue(`stops.${index}.locationName`, loc.name, { shouldValidate: true });
    setValue(`stops.${index}.locationId`, loc.id);
    setSelectedStopLocs((prev) => {
      const updated = [...prev];
      updated[index] = loc;
      return updated;
    });
  };

  const handleRemoveStop = (index) => {
    remove(index);
    setSelectedStopLocs((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    setDistances([]);
    setTotalDistance(null);
  };

  const onSubmit = (values) => {
    // Customer is required by backend; derive from selected locations or fallback.
    let customerId = derivedCustomerId;
    if (!customerId) {
      customerId = allLocations.find((l) => l.customerId)?.customerId || null;
    }
    if (!customerId) {
      enqueueSnackbar(
        'Please select a saved delivery location so the trip can be linked to a customer.',
        { variant: 'error' }
      );
      return;
    }

    const lastStop = values.stops[values.stops.length - 1];
    const payload = {
      customerId,
      origin: values.origin,
      destination: lastStop.locationName,
      ...(values.endPoint && { endPoint: values.endPoint }),
      scheduledDate: values.scheduledDate,
      ...(values.scheduledTime && { scheduledTime: values.scheduledTime }),
      ...(values.cargoDescription && { cargoDescription: values.cargoDescription }),
      ...(values.remarks && { remarks: values.remarks }),
      stops: values.stops.map((s) => ({
        locationName: s.locationName,
        locationId: s.locationId || null,
      })),
    };

    createTrip.mutate(payload, {
      onSuccess: () => {
        enqueueSnackbar('Trip created successfully!', { variant: 'success' });
        navigate('/trips');
      },
      onError: (err) => {
        enqueueSnackbar(err.response?.data?.message || 'Failed to create trip', {
          variant: 'error',
        });
      },
    });
  };

  const locationOption = (props, opt) => (
    <li {...props} key={opt.id}>
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {opt.name}
        </Typography>
        {opt.customer && (
          <Typography variant="caption" color="text.secondary">
            {opt.customer.companyName}
          </Typography>
        )}
      </Box>
    </li>
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/trips')} size="small" sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Create New Trip
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Plan your delivery route
          </Typography>
        </Box>
      </Stack>

      {/* Auto-detected customer banner */}
      {derivedCustomer && (
        <Alert
          severity="success"
          icon={<BusinessIcon fontSize="inherit" />}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <Typography variant="caption" fontWeight={600}>
            Customer: {derivedCustomer.companyName}
          </Typography>
        </Alert>
      )}

      {/* Section 1: Schedule */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <SectionHeader icon={CalendarTodayIcon} title="Schedule" />
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
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
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
                label="Start Time (optional)"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Stack>
      </Paper>

      {/* Section 2: Route */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <SectionHeader
          icon={RouteIcon}
          title="Route"
          subtitle="Starting point and optional return point"
        />
        <Stack spacing={2}>
          <Controller
            name="origin"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={allLocations}
                loading={locationsLoading}
                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
                inputValue={field.value}
                onInputChange={(_, val) => field.onChange(val)}
                onChange={(_, val) => {
                  if (val && typeof val === 'object') handleOriginSelect(val);
                }}
                renderOption={locationOption}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Starting Point"
                    size="small"
                    placeholder="Warehouse, depot or starting address"
                    error={!!errors.origin}
                    helperText={errors.origin?.message}
                  />
                )}
              />
            )}
          />

          <Controller
            name="endPoint"
            control={control}
            render={({ field }) => (
              <Autocomplete
                freeSolo
                options={allLocations}
                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
                inputValue={field.value}
                onInputChange={(_, val) => field.onChange(val)}
                onChange={(_, val) => {
                  if (val && typeof val === 'object') field.onChange(val.name);
                }}
                renderOption={locationOption}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Return / End Point (optional)"
                    size="small"
                    placeholder="Where the trip ends, e.g. depot"
                    helperText="Leave empty if the trip ends at the last delivery stop"
                  />
                )}
              />
            )}
          />

          {routePreview && (
            <Chip
              icon={<LocalShippingIcon />}
              label={routePreview}
              variant="outlined"
              color="primary"
              size="small"
              sx={{
                maxWidth: '100%',
                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
              }}
            />
          )}
        </Stack>
      </Paper>

      {/* Section 3: Delivery Stops */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <SectionHeader
            icon={LocationOnIcon}
            title="Delivery Stops"
            subtitle="At least one stop required"
          />
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => append({ locationId: '', locationName: '' })}
            sx={{ flexShrink: 0, mt: 0.25 }}
          >
            Add Stop
          </Button>
        </Stack>

        {errors.stops?.message && (
          <Typography variant="caption" color="error" sx={{ mb: 1.5, display: 'block' }}>
            {errors.stops.message}
          </Typography>
        )}

        <Stack spacing={1.5}>
          {fields.map((item, index) => (
            <Box key={item.id}>
              {distances[index] != null && (
                <Stack direction="row" justifyContent="center" sx={{ py: 0.75 }}>
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
              <Paper
                elevation={0}
                sx={{
                  p: 1.75,
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.25 }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {index === fields.length - 1
                      ? `Stop ${index + 1} — Final Destination`
                      : `Stop ${index + 1}`}
                  </Typography>
                  {fields.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveStop(index)}
                      color="error"
                    >
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
                      options={allLocations}
                      loading={locationsLoading}
                      getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
                      inputValue={field.value}
                      onInputChange={(_, val) => field.onChange(val)}
                      onChange={(_, val) => {
                        if (val && typeof val === 'object') handleStopSelect(index, val);
                      }}
                      renderOption={locationOption}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Delivery Location"
                          size="small"
                          placeholder="Search saved locations or type address"
                          error={!!errors.stops?.[index]?.locationName}
                          helperText={errors.stops?.[index]?.locationName?.message}
                        />
                      )}
                    />
                  )}
                />
              </Paper>
            </Box>
          ))}
        </Stack>

        {totalDistance != null && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'info.light',
              border: '1px solid',
              borderColor: 'info.main',
              textAlign: 'center',
              opacity: 0.85,
            }}
          >
            <Typography variant="body2" fontWeight={700} color="info.contrastText">
              Total Route Distance: {totalDistance} km
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Section 4: Notes */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <SectionHeader icon={NotesIcon} title="Notes" />
        <Stack spacing={2}>
          <Controller
            name="cargoDescription"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Cargo Description"
                fullWidth
                size="small"
                placeholder="What are you delivering?"
                error={!!errors.cargoDescription}
                helperText={errors.cargoDescription?.message}
              />
            )}
          />
          <Controller
            name="remarks"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Remarks"
                fullWidth
                multiline
                minRows={2}
                size="small"
                placeholder="Any special instructions or notes"
              />
            )}
          />
        </Stack>
      </Paper>

      {/* Submit */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleSubmit(onSubmit)}
        disabled={createTrip.isPending}
        startIcon={
          createTrip.isPending ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <LocalShippingIcon />
          )
        }
        sx={{ py: 1.75, borderRadius: 2, fontSize: '1rem', fontWeight: 700, mb: 2 }}
      >
        {createTrip.isPending ? 'Creating Trip...' : 'Create Trip'}
      </Button>
    </Box>
  );
}
