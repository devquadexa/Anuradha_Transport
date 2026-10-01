import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Divider,
  Chip,
  IconButton,
  Button,
  TextField,
  Paper,
  Collapse,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircle';
import EventIcon from '@mui/icons-material/Event';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SpeedIcon from '@mui/icons-material/Speed';
import { getCurrentPosition, getDrivingDistanceKm, reverseGeocode } from '../../../utils/gps';
import { startTracking, stopTracking } from '../../../services/gpsTracker';
import RouteOptimizationDialog from './RouteOptimizationDialog';
import MeterReadingDialog from './MeterReadingDialog';

const TRIP_STATUS_COLORS = {
  pending: 'default',
  assigned: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const STOP_STATUS_COLORS = {
  pending: 'default',
  arrived: 'info',
  delivered: 'success',
  skipped: 'error',
};

const NEXT_STATUS_ACTIONS = {
  assigned: { next: 'in_progress', label: 'Start Trip' },
  in_progress: { next: 'completed', label: 'Complete Trip' },
};

export default function TripDetailDrawer({
  open,
  trip,
  onClose,
  onAdvanceStatus,
  onUpdateStopDetails,
  onSetEmergencyStop,
  onReorderStops,
  canAdvance = false,
  canEditStops = false,
  isDriver = false,
  advancing = false,
  savingStop = false,
  settingEmergency = false,
  reordering = false,
}) {
  const [expandedStop, setExpandedStop] = useState(null);
  const [stopEdits, setStopEdits] = useState({});
  const [gettingGps, setGettingGps] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  // Meter-reading prompt: shown before the route dialog. When submitted, it
  // saves the odometer for `meterTarget` stop, then opens the route dialog.
  const [meterTarget, setMeterTarget] = useState(null); // the stop awaiting a reading
  const [savingMeter, setSavingMeter] = useState(false);
  const [showFinalMeterDialog, setShowFinalMeterDialog] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(false);

  useEffect(() => {
    if (trip) {
      const edits = {};
      (trip.stops || []).forEach((stop) => {
        edits[stop.id] = {
          invoices: stop.invoices?.length > 0 ? [...stop.invoices] : [''],
          driverMileage: stop.driverMileage != null ? String(stop.driverMileage) : '',
          odometerReading: stop.odometerReading != null ? String(stop.odometerReading) : '',
        };
      });
      setStopEdits(edits);
      setExpandedStop(null);
    }
  }, [trip]);

  if (!trip) return null;
  const action = NEXT_STATUS_ACTIONS[trip.status];

  const currentStopIndex = (trip.stops || []).findIndex((s) => s.status !== 'delivered');

  const pendingStops = (trip.stops || []).filter((s) => s.status !== 'delivered');
  const pendingStopCount = pendingStops.length;

  // Reorder pending stops by distance from the reference point (last delivered
  // stop, else trip origin). direction 'asc' = nearest first, 'desc' = farthest
  // first. Delivered stops keep their positions at the front.
  const handleReorderByDistance = async (direction = 'asc') => {
    if (!onReorderStops) return;
    const stops = trip.stops || [];
    const delivered = stops.filter((s) => s.status === 'delivered');
    const pending = stops.filter((s) => s.status !== 'delivered');
    if (pending.length < 2) return;

    // Reference origin: last delivered stop's coords, else trip start coords.
    let refLat = trip.startLatitude;
    let refLon = trip.startLongitude;
    if (delivered.length > 0) {
      const last = delivered[delivered.length - 1];
      if (last.latitude && last.longitude) {
        refLat = last.latitude;
        refLon = last.longitude;
      }
    }

    // Measure each pending stop's distance from the reference point.
    const withDistance = [];
    for (const stop of pending) {
      let dist = Number.MAX_SAFE_INTEGER;
      if (refLat && refLon && stop.latitude && stop.longitude) {
        const km = await getDrivingDistanceKm(refLat, refLon, stop.latitude, stop.longitude);
        if (km != null) dist = km;
      } else if (stop.expectedMileage != null) {
        // Fallback to stored expected mileage when coordinates are unavailable.
        dist = Number(stop.expectedMileage);
      }
      withDistance.push({ stop, dist });
    }

    withDistance.sort((a, b) => (direction === 'desc' ? b.dist - a.dist : a.dist - b.dist));

    const orderedStops = [
      ...delivered.map((s) => ({ id: s.id })),
      ...withDistance.map(({ stop, dist }) => ({
        id: stop.id,
        expectedMileage: Number.isFinite(dist) && dist !== Number.MAX_SAFE_INTEGER ? Math.round(dist * 100) / 100 : undefined,
      })),
    ];

    onReorderStops(orderedStops);
  };

  // Open the meter-reading prompt for a stop. On submit it saves the reading
  // then opens the route dialog. `stop` may be null (route only).
  const openMeterPrompt = (stop) => {
    setMeterTarget(stop || null);
  };

  const handleMeterSubmit = async (reading) => {
    const stop = meterTarget;
    if (stop && onUpdateStopDetails) {
      setSavingMeter(true);
      try {
        await onUpdateStopDetails(stop.id, { odometerReading: reading });
      } finally {
        setSavingMeter(false);
      }
    }
    setMeterTarget(null);
    setShowRouteDialog(true);
  };

  // Final vehicle meter reading, captured when completing the trip at the
  // end point, then advances the trip status to completed.
  const handleFinalMeterSubmit = async (reading) => {
    setCompletingTrip(true);
    try {
      setGettingGps(true);
      const gps = await getCurrentPosition();
      setGettingGps(false);
      await onAdvanceStatus('completed', gps, { finalOdometerReading: reading });
      stopTracking();
    } finally {
      setCompletingTrip(false);
      setShowFinalMeterDialog(false);
    }
  };

  const handleStopFieldChange = (stopId, field, value) => {
    setStopEdits((prev) => ({
      ...prev,
      [stopId]: { ...prev[stopId], [field]: value },
    }));
  };

  const handleInvoiceChange = (stopId, index, value) => {
    setStopEdits((prev) => {
      const invoices = [...(prev[stopId]?.invoices || [''])];
      invoices[index] = value;
      return { ...prev, [stopId]: { ...prev[stopId], invoices } };
    });
  };

  const handleAddInvoice = (stopId) => {
    setStopEdits((prev) => {
      const invoices = [...(prev[stopId]?.invoices || ['']), ''];
      return { ...prev, [stopId]: { ...prev[stopId], invoices } };
    });
  };

  const handleRemoveInvoice = (stopId, index) => {
    setStopEdits((prev) => {
      const invoices = [...(prev[stopId]?.invoices || [''])];
      invoices.splice(index, 1);
      if (invoices.length === 0) invoices.push('');
      return { ...prev, [stopId]: { ...prev[stopId], invoices } };
    });
  };

  const hasStopChanged = (stop) => {
    const edit = stopEdits[stop.id];
    if (!edit) return false;
    const origInvoices = stop.invoices?.length > 0 ? stop.invoices : [''];
    const invoicesChanged = JSON.stringify(edit.invoices) !== JSON.stringify(origInvoices);
    const origMileage = stop.driverMileage != null ? String(stop.driverMileage) : '';
    const mileageChanged = edit.driverMileage !== origMileage;
    return invoicesChanged || mileageChanged;
  };

  const handleSaveStop = async (stop) => {
    const edit = stopEdits[stop.id];
    if (!edit || !onUpdateStopDetails) return;
    const invoices = edit.invoices.filter((inv) => inv.trim() !== '');
    const payload = {
      invoices: invoices.length > 0 ? invoices : null,
      driverMileage: edit.driverMileage ? parseFloat(edit.driverMileage) : null,
    };
    onUpdateStopDetails(stop.id, payload);
  };

  const handleMarkDelivered = async (stop) => {
    if (!onUpdateStopDetails) return;
    setGettingGps(true);
    const gps = await getCurrentPosition();

    let gpsMileage = null;
    let gpsLocationName = null;

    if (gps) {
      gpsLocationName = await reverseGeocode(gps.latitude, gps.longitude);

      const stopIndex = (trip.stops || []).findIndex((s) => s.id === stop.id);
      let refLat, refLon;
      if (stopIndex > 0) {
        const prevStop = trip.stops[stopIndex - 1];
        refLat = prevStop.latitude;
        refLon = prevStop.longitude;
      } else {
        refLat = trip.startLatitude;
        refLon = trip.startLongitude;
      }

      if (refLat && refLon) {
        gpsMileage = await getDrivingDistanceKm(refLat, refLon, gps.latitude, gps.longitude);
      }
    }

    setGettingGps(false);

    const edit = stopEdits[stop.id] || {};
    const invoices = (edit.invoices || []).filter((inv) => inv.trim() !== '');
    const payload = {
      status: 'delivered',
      invoices: invoices.length > 0 ? invoices : null,
      driverMileage: edit.driverMileage ? parseFloat(edit.driverMileage) : null,
      ...(gps || {}),
      gpsLocationName,
      gpsMileage,
    };
    onUpdateStopDetails(stop.id, payload);

    // For the next stop, prompt for the meter reading first (which then opens
    // the route dialog) — same flow as every location.
    const stops = trip.stops || [];
    const currentIndex = stops.findIndex((s) => s.id === stop.id);
    const nextStop = stops[currentIndex + 1];
    if (nextStop) {
      setTimeout(() => setMeterTarget(nextStop), 500);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 440 },
          maxWidth: '100vw',
          borderRadius: '0 !important',
          border: 'none !important',
          boxShadow: 'none',
        },
      }}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
    >
      <Box sx={{ overflowY: 'auto', height: '100%', bgcolor: (t) => (t.palette.mode === 'dark' ? 'background.default' : 'grey.50') }}>
        {/* Gradient header band */}
        <Box
          sx={{
            position: 'relative',
            px: { xs: 2, sm: 3 },
            pt: { xs: 2.5, sm: 3 },
            pb: { xs: 3, sm: 3.5 },
            color: 'common.white',
            background: (t) => `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 55%, ${t.palette.primary.light} 100%)`,
          }}
        >
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ position: 'absolute', top: 12, right: 12, color: 'common.white', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Typography variant="overline" sx={{ opacity: 0.75, letterSpacing: 1.2 }}>
            Trip Details
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1.25, pr: 4 }}>
            {trip.tripNumber}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              sx={{ textTransform: 'capitalize', bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white', fontWeight: 700 }}
              label={trip.status.replace('_', ' ')}
            />
            {trip.approvalStatus && (
              <Chip
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize', color: 'common.white', borderColor: 'rgba(255,255,255,0.5)' }}
                label={`Approval: ${trip.approvalStatus}`}
              />
            )}
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            {/* Route visual card */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1.5}>
                <Stack alignItems="center" sx={{ pt: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid', borderColor: 'primary.main' }} />
                  <Box sx={{ flexGrow: 1, width: 2, minHeight: 24, my: 0.5, bgcolor: 'divider' }} />
                  <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                </Stack>
                <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Origin</Typography>
                    <Typography variant="body1" fontWeight={700} noWrap>{trip.origin}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Destination</Typography>
                    <Typography variant="body1" fontWeight={700} noWrap>{trip.destination}</Typography>
                  </Box>
                  {trip.endPoint && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">End Point</Typography>
                      <Typography variant="body1" fontWeight={700} noWrap>{trip.endPoint}</Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" spacing={0.75} alignItems="center">
                <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {trip.scheduledDate} {trip.scheduledTime ? `at ${trip.scheduledTime.slice(0, 5)}` : ''}
                </Typography>
              </Stack>
              {trip.finalOdometerReading != null && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <SpeedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      Final Vehicle Meter Reading:
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>{trip.finalOdometerReading} km</Typography>
                  </Stack>
                </>
              )}
            </Paper>

            {/* Info tiles */}
            <Stack direction="row" spacing={1.5}>
              <InfoTile
                icon={<PersonIcon fontSize="small" />}
                label="Driver"
                value={trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'Not assigned'}
                fullWidth
              />
            </Stack>

            {trip.cargoDescription && (
              <InfoTile icon={<Inventory2Icon fontSize="small" />} label="Cargo" value={trip.cargoDescription} fullWidth />
            )}

            {/* Delivery Stops */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap gap={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                Delivery Locations
              </Typography>
              {onReorderStops && pendingStopCount >= 2 && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {reordering && <CircularProgress size={14} sx={{ mr: 0.5 }} />}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ArrowUpwardIcon fontSize="small" />}
                    onClick={() => handleReorderByDistance('asc')}
                    disabled={reordering}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Nearest
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ArrowDownwardIcon fontSize="small" />}
                    onClick={() => handleReorderByDistance('desc')}
                    disabled={reordering}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Farthest
                  </Button>
                </Stack>
              )}
            </Stack>

            {trip.stops?.length > 0 ? (
              <Stack spacing={1.5}>
                {trip.stops.map((stop, index) => {
                  const isExpanded = expandedStop === stop.id;
                  const edit = stopEdits[stop.id] || { invoices: [''], driverMileage: '' };
                  const isDelivered = stop.status === 'delivered';
                  const isCurrentStop = index === currentStopIndex;
                  const isLockedFuture = index > currentStopIndex && !isDelivered;

                  return (
                    <Paper
                      key={stop.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isDelivered ? 'success.light' : isCurrentStop ? 'primary.light' : 'divider',
                        bgcolor: (t) => {
                          const dark = t.palette.mode === 'dark';
                          if (isDelivered) return dark ? 'rgba(34,197,94,0.12)' : 'success.50';
                          if (isCurrentStop) return dark ? 'rgba(59,130,246,0.12)' : 'primary.50';
                          return 'background.paper';
                        },
                        opacity: isLockedFuture ? 0.6 : 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ cursor: isLockedFuture ? 'default' : 'pointer' }}
                        onClick={() => !isLockedFuture && setExpandedStop(isExpanded ? null : stop.id)}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: isDelivered ? 'success.main' : isCurrentStop ? 'primary.main' : 'grey.400',
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {isDelivered ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : stop.sequenceNo}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{stop.locationName}</Typography>
                            {stop.contactName && (
                              <Typography variant="caption" color="text.secondary">
                                {stop.contactName} {stop.contactPhone ? `• ${stop.contactPhone}` : ''}
                              </Typography>
                            )}
                            {!isDriver && stop.expectedMileage != null && (
                              <Typography variant="caption" color="info.main" fontWeight={600}>
                                Expected: {stop.expectedMileage} km
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            size="small"
                            label={isLockedFuture ? 'waiting' : stop.status}
                            color={isLockedFuture ? 'default' : STOP_STATUS_COLORS[stop.status]}
                            sx={{ height: 20, fontSize: 10, textTransform: 'capitalize' }}
                          />
                          {!isLockedFuture && (isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
                        </Stack>
                      </Stack>

                      <Collapse in={isExpanded && !isLockedFuture}>
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                          {/* Expected mileage from saved locations */}
                          {!isDriver && stop.expectedMileage != null && (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">Map Distance:</Typography>
                              <Chip size="small" label={`${stop.expectedMileage} km`} color="info" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                            </Stack>
                          )}

                          {/* Show GPS verification data for delivered stops */}
                          {isDelivered && (
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: 1.5,
                                bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(148,163,184,0.08)' : 'grey.50'),
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Stack spacing={0.5}>
                                {!isDriver && stop.gpsMileage != null && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>GPS Distance:</Typography>
                                    <Typography variant="body2" fontWeight={700}>{stop.gpsMileage} km</Typography>
                                    <Chip size="small" label="GPS verified" color="success" sx={{ height: 18, fontSize: 9 }} />
                                  </Stack>
                                )}
                                {stop.driverMileage != null && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>Driver Mileage:</Typography>
                                    <Typography variant="body2" fontWeight={700}>{stop.driverMileage} km</Typography>
                                  </Stack>
                                )}
                                {!isDriver && stop.gpsMileage != null && stop.driverMileage != null && (() => {
                                  const diff = Number(stop.driverMileage) - Number(stop.gpsMileage);
                                  const absDiff = Math.abs(diff);
                                  const pct = Number(stop.gpsMileage) > 0 ? (absDiff / Number(stop.gpsMileage)) * 100 : 0;
                                  const isOver = diff > 0;
                                  const diffColor = absDiff < 0.01 ? 'success.main' : pct > 10 ? 'error.main' : 'warning.main';
                                  return (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>Difference:</Typography>
                                      <Typography variant="body2" fontWeight={700} sx={{ color: diffColor }}>
                                        {absDiff < 0.01 ? 'No difference' : `${isOver ? '+' : '−'}${absDiff.toFixed(2)} km (${pct.toFixed(1)}%)`}
                                      </Typography>
                                      {absDiff >= 0.01 && (
                                        <Chip
                                          size="small"
                                          label={isOver ? 'Driver over' : 'Driver under'}
                                          color={pct > 10 ? 'error' : 'warning'}
                                          variant="outlined"
                                          sx={{ height: 18, fontSize: 9 }}
                                        />
                                      )}
                                    </Stack>
                                  );
                                })()}
                                {stop.odometerReading != null && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>Vehicle Meter:</Typography>
                                    <Typography variant="body2" fontWeight={700}>{stop.odometerReading} km</Typography>
                                  </Stack>
                                )}
                                {!isDriver && stop.gpsLocationName && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>Location:</Typography>
                                    <Typography variant="body2">{stop.gpsLocationName}</Typography>
                                  </Stack>
                                )}
                                {stop.invoices?.length > 0 && (
                                  <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>Invoices:</Typography>
                                    <Stack spacing={0.25}>
                                      {stop.invoices.map((inv, i) => (
                                        <Typography key={i} variant="body2">{inv}</Typography>
                                      ))}
                                    </Stack>
                                  </Stack>
                                )}
                              </Stack>
                            </Paper>
                          )}

                          {/* Editable fields — only once the trip has started */}
                          {canEditStops && !isDelivered && isCurrentStop && trip.status === 'in_progress' && (
                            <>
                              {/* View Route — prompts for the meter reading first */}
                              <Button
                                variant="contained"
                                size="small"
                                color="primary"
                                startIcon={<GpsFixedIcon />}
                                onClick={() => openMeterPrompt(stop)}
                                fullWidth
                              >
                                View Best Route to {stop.locationName}
                              </Button>

                              <TextField
                                label="Driver Mileage (km)"
                                size="small"
                                fullWidth
                                type="number"
                                value={edit.driverMileage}
                                onChange={(e) => handleStopFieldChange(stop.id, 'driverMileage', e.target.value)}
                                placeholder="Manual mileage reading"
                                inputProps={{ min: 0, step: '0.01' }}
                              />

                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                  Invoice Numbers
                                </Typography>
                                <Stack spacing={1}>
                                  {(edit.invoices || ['']).map((inv, i) => (
                                    <Stack key={i} direction="row" spacing={0.5} alignItems="center">
                                      <TextField
                                        size="small"
                                        fullWidth
                                        value={inv}
                                        onChange={(e) => handleInvoiceChange(stop.id, i, e.target.value)}
                                        placeholder={`Invoice #${i + 1}`}
                                      />
                                      {edit.invoices.length > 1 && (
                                        <IconButton size="small" color="error" onClick={() => handleRemoveInvoice(stop.id, i)}>
                                          <RemoveCircleOutlineIcon fontSize="small" />
                                        </IconButton>
                                      )}
                                    </Stack>
                                  ))}
                                  <Button size="small" startIcon={<AddIcon />} onClick={() => handleAddInvoice(stop.id)} sx={{ alignSelf: 'flex-start' }}>
                                    Add Invoice
                                  </Button>
                                </Stack>
                              </Box>

                              <Typography variant="caption" color="text.secondary">
                                📍 GPS mileage will be auto-calculated when you mark this as delivered.
                              </Typography>

                              <Stack direction="row" spacing={1}>
                                {hasStopChanged(stop) && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<SaveIcon />}
                                    onClick={() => handleSaveStop(stop)}
                                    disabled={savingStop}
                                  >
                                    {savingStop ? 'Saving...' : 'Save'}
                                  </Button>
                                )}
                                <Button
                                  variant="contained"
                                  size="small"
                                  color="success"
                                  startIcon={gettingGps ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                                  onClick={() => handleMarkDelivered(stop)}
                                  disabled={
                                    savingStop ||
                                    gettingGps ||
                                    !edit.driverMileage ||
                                    !(edit.invoices || []).some((inv) => inv.trim() !== '')
                                  }
                                >
                                  {gettingGps ? 'Getting GPS...' : 'Mark Delivered'}
                                </Button>
                              </Stack>
                            </>
                          )}
                        </Stack>
                      </Collapse>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Paper elevation={0} sx={{ p: 2, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <LocationOnIcon color="action" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  No intermediate stops — direct delivery from origin to destination.
                </Typography>
              </Paper>
            )}
          </Box>

          {trip.remarks && (
            <>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Remarks</Typography>
                <Typography variant="body2">{trip.remarks}</Typography>
              </Box>
            </>
          )}

          {/* Emergency stop toggle — shown while the trip is in progress */}
          {onSetEmergencyStop && trip.status === 'in_progress' && (
            <>
              <Divider />
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: trip.emergencyStop ? 'error.light' : 'divider',
                  bgcolor: (t) =>
                    trip.emergencyStop
                      ? (t.palette.mode === 'dark' ? 'rgba(220,38,38,0.14)' : 'error.50')
                      : 'background.paper',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <ReportProblemIcon color={trip.emergencyStop ? 'error' : 'warning'} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {trip.emergencyStop ? 'Emergency Stop Active' : 'Emergency Stop'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {trip.emergencyStop
                        ? 'Admin has been notified you are stopped.'
                        : 'Turn on if you need to stop during the trip.'}
                    </Typography>
                  </Box>
                  <Button
                    variant={trip.emergencyStop ? 'outlined' : 'contained'}
                    color="error"
                    size="small"
                    disabled={settingEmergency}
                    onClick={() => onSetEmergencyStop(!trip.emergencyStop)}
                  >
                    {settingEmergency ? '...' : trip.emergencyStop ? 'Clear' : 'Activate'}
                  </Button>
                </Stack>
              </Paper>
            </>
          )}

          {canAdvance && action && (
            <>
              <Divider />
              {action.next === 'in_progress' ? (
                /* Start Trip - prompt for the meter reading, then show route. */
                <Button
                  variant="contained"
                  fullWidth
                  disabled={advancing}
                  startIcon={<GpsFixedIcon />}
                  onClick={() => openMeterPrompt((trip.stops || []).find((s) => s.status !== 'delivered') || null)}
                >
                  Start Trip
                </Button>
              ) : (
                /* Complete Trip - prompt for the final vehicle meter reading first */
                <Button
                  variant="contained"
                  fullWidth
                  disabled={advancing || gettingGps}
                  startIcon={gettingGps ? <CircularProgress size={16} color="inherit" /> : <GpsFixedIcon />}
                  onClick={() => setShowFinalMeterDialog(true)}
                >
                  {gettingGps ? 'Getting location...' : advancing ? 'Updating...' : action.label}
                </Button>
              )}
            </>
          )}

          {/* Meter reading prompt — shown before the route dialog */}
          <MeterReadingDialog
            open={!!meterTarget}
            locationName={meterTarget?.locationName}
            submitting={savingMeter}
            onSubmit={handleMeterSubmit}
            onClose={() => setMeterTarget(null)}
          />

          {/* Final meter reading prompt — shown before completing the trip */}
          <MeterReadingDialog
            open={showFinalMeterDialog}
            locationName={trip.endPoint || trip.destination}
            submitting={completingTrip || gettingGps}
            onSubmit={handleFinalMeterSubmit}
            onClose={() => setShowFinalMeterDialog(false)}
          />

          {/* Route Optimization Dialog */}
          <RouteOptimizationDialog
            open={showRouteDialog}
            trip={trip}
            onClose={() => setShowRouteDialog(false)}
            onStartTrip={async (midpoint) => {
              setShowRouteDialog(false);
              
              // If trip is still assigned (not started yet), start it
              if (trip.status === 'assigned') {
                setGettingGps(true);
                const gps = await getCurrentPosition();
                setGettingGps(false);
                onAdvanceStatus('in_progress', gps);
                // Start GPS tracking
                startTracking(trip.id);
              }

              // Open Google Maps navigation to next pending stop with route midpoint as waypoint
              const stops = trip.stops || [];
              const nextStop = stops.find((s) => s.status !== 'delivered');
              if (nextStop) {
                const nextIndex = stops.findIndex((s) => s.id === nextStop.id);
                const previousStop = nextIndex > 0 ? stops[nextIndex - 1] : null;
                const originName = previousStop ? previousStop.locationName : trip.origin;
                const origin = encodeURIComponent(originName);
                const destination = encodeURIComponent(nextStop.locationName);
                
                // Use midpoint as waypoint to force Google Maps to use the selected route
                let url;
                if (midpoint) {
                  const wp = `${midpoint.lat},${midpoint.lng}`;
                  url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${wp}&travelmode=driving&dir_action=navigate`;
                } else {
                  url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`;
                }
                window.open(url, '_blank');
              }
            }}
          />
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}

function InfoTile({ icon, label, value, fullWidth = false }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        flex: fullWidth ? '1 1 100%' : 1,
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary', mb: 0.5 }}>
        {icon}
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="body2" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Paper>
  );
}
