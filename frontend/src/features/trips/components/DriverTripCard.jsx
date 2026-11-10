import { Box, Card, CardActionArea, Chip, Divider, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'default',  borderColor: 'grey.400',    icon: HourglassTopIcon },
  assigned:    { label: 'Assigned',    color: 'info',     borderColor: 'info.main',   icon: AssignmentIndIcon },
  in_progress: { label: 'In Progress', color: 'warning',  borderColor: 'warning.main',icon: LocalShippingIcon },
  completed:   { label: 'Completed',   color: 'success',  borderColor: 'success.main',icon: CheckCircleIcon },
  cancelled:   { label: 'Cancelled',   color: 'error',    borderColor: 'error.main',  icon: DoNotDisturbIcon },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return null;
  return timeStr.slice(0, 5);
}

export default function DriverTripCard({ trip, onView, onViewInvoice }) {
  const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const stopCount = trip.stops?.length || 0;
  const completedStops = trip.stops?.filter((s) => s.deliveryTime || s.isDelivered)?.length || 0;
  const hasProgress = trip.status === 'in_progress' && stopCount > 0;
  const progressPct = hasProgress ? Math.round((completedStops / stopCount) * 100) : 0;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: trip.emergencyStop ? 'error.main' : 'divider',
        overflow: 'visible',
        position: 'relative',
        transition: 'box-shadow 0.15s ease',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
        // Left status accent
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          borderRadius: '10px 0 0 10px',
          bgcolor: cfg.borderColor,
        },
        pl: '4px',
      }}
    >
      <CardActionArea
        onClick={onView}
        sx={{ borderRadius: 2.5, '&:hover': { bgcolor: 'transparent' } }}
      >
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          {/* Top row: trip number + badges */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ letterSpacing: 0.3 }}>
                TRIP ID
              </Typography>
              <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {trip.tripNumber}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              {trip.emergencyStop && (
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: '0.8rem !important' }} />}
                  label="Emergency"
                  color="error"
                  size="small"
                  sx={{ height: 24, fontSize: '0.68rem', fontWeight: 700 }}
                />
              )}
              <Chip
                icon={<StatusIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={cfg.label}
                color={cfg.color}
                size="small"
                variant="filled"
                sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700 }}
              />
            </Stack>
          </Stack>

          {/* Route */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, minWidth: 0 }}>
            <LocationOnIcon sx={{ fontSize: 15, color: 'primary.main', flexShrink: 0 }} />
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ flex: '1 1 0', minWidth: 0, color: 'text.primary' }}
            >
              {trip.origin}
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ flex: '1 1 0', minWidth: 0, textAlign: 'right', color: 'text.primary' }}
            >
              {trip.destination}
            </Typography>
          </Stack>

          {/* Meta: date, time, stops */}
          <Stack
            direction="row"
            spacing={0}
            sx={{ flexWrap: 'wrap', gap: 1.5, mb: trip.customer?.companyName ? 1.25 : 0 }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {formatDate(trip.scheduledDate)}
              </Typography>
            </Stack>
            {trip.scheduledTime && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {formatTime(trip.scheduledTime)}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {stopCount} {stopCount === 1 ? 'stop' : 'stops'}
                {hasProgress ? ` · ${completedStops} done` : ''}
              </Typography>
            </Stack>
          </Stack>

          {/* Customer */}
          {trip.customer?.companyName && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <BusinessIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {trip.customer.companyName}
              </Typography>
            </Stack>
          )}

          {/* Progress bar for in-progress trips */}
          {hasProgress && (
            <Box sx={{ mt: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Delivery Progress
                </Typography>
                <Typography variant="caption" color="warning.main" fontWeight={700}>
                  {progressPct}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progressPct}
                color="warning"
                sx={{ height: 5, borderRadius: 3 }}
              />
            </Box>
          )}
        </Box>
      </CardActionArea>

      <Divider />

      {/* Actions */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: { xs: 2, sm: 2.5 }, py: 1.25, gap: 1 }}
      >
        <Box
          onClick={onView}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            py: 0.75,
            px: 1.5,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'primary.main',
            color: 'primary.main',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.15s',
            '&:hover': { bgcolor: 'primary.main', color: 'white' },
            '&:active': { opacity: 0.8 },
          }}
        >
          <Typography variant="caption" fontWeight={700}>
            View Details
          </Typography>
        </Box>

        {trip.status === 'completed' && onViewInvoice && (
          <Tooltip title="View Invoice" placement="top">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onViewInvoice(trip); }}
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'success.lighter',
                color: 'success.dark',
                border: '1px solid',
                borderColor: 'success.light',
                borderRadius: 1.5,
                '&:hover': { bgcolor: 'success.main', color: 'white' },
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Card>
  );
}
