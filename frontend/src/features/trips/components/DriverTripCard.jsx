import { alpha } from '@mui/material/styles';
import { Box, Button, Card, CardActionArea, Chip, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'default',  paletteKey: 'grey',    icon: HourglassTopIcon },
  assigned:    { label: 'Assigned',    color: 'info',     paletteKey: 'info',    icon: AssignmentIndIcon },
  in_progress: { label: 'In Progress', color: 'warning',  paletteKey: 'warning', icon: LocalShippingIcon },
  completed:   { label: 'Completed',   color: 'success',  paletteKey: 'success', icon: CheckCircleIcon },
  cancelled:   { label: 'Cancelled',   color: 'error',    paletteKey: 'error',   icon: DoNotDisturbIcon },
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

function MetaPill({ icon: Icon, children }) {
  return (
    <Stack
      direction="row"
      spacing={0.6}
      sx={{ alignItems: 'center', px: 1.1,
        py: 0.45,
        borderRadius: 5,
        bgcolor: (t) => alpha(t.palette.text.primary, 0.06), }}
    >
      <Icon sx={{ fontSize: 14, color: 'text.secondary' }} />
      <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {children}
      </Typography>
    </Stack>
  );
}

export default function DriverTripCard({ trip, onView, onViewInvoice }) {
  const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const stopCount = trip.stops?.length || 0;
  const completedStops = trip.stops?.filter((s) => s.deliveryTime || s.isDelivered)?.length || 0;
  const hasProgress = trip.status === 'in_progress' && stopCount > 0;
  const progressPct = hasProgress ? Math.round((completedStops / stopCount) * 100) : 0;
  const accent = (t) => (cfg.paletteKey === 'grey' ? t.palette.grey[500] : t.palette[cfg.paletteKey].main);

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: trip.emergencyStop ? 'error.main' : 'divider',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          boxShadow: (t) => `0 10px 28px -12px ${alpha(accent(t), 0.55)}`,
          transform: 'translateY(-2px)',
          borderColor: (t) => alpha(accent(t), 0.6),
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: accent,
        },
      }}
    >
      <CardActionArea
        onClick={onView}
        sx={{ display: 'block', width: '100%', '&:hover .MuiCardActionArea-focusHighlight': { opacity: 0.04 } }}
      >
        <Box sx={{ p: { xs: 2, sm: 2.5 }, pl: { xs: 2.5, sm: 3 } }}>
          {/* Top row: trip number (left) + status badges (right) */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.8, display: 'block' }}>
                TRIP ID
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.2 }}>
                {trip.tripNumber}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
              {trip.emergencyStop && (
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: '0.9rem !important' }} />}
                  label="Emergency"
                  color="error"
                  size="small"
                  sx={{ height: 26, fontSize: '0.72rem', fontWeight: 700 }}
                />
              )}
              <Chip
                icon={<StatusIcon sx={{ fontSize: '0.95rem !important' }} />}
                label={cfg.label}
                color={cfg.color}
                size="small"
                sx={{ height: 26, fontSize: '0.74rem', fontWeight: 700, borderRadius: 5 }}
              />
            </Stack>
          </Box>

          {/* Route timeline: origin → destination */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: '5px', flexShrink: 0 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid', borderColor: 'primary.main' }} />
              <Box sx={{ flex: 1, width: 0, my: 0.5, borderLeft: '2px dashed', borderColor: 'divider' }} />
              <PlaceOutlinedIcon sx={{ fontSize: 16, color: 'error.main', mb: '1px' }} />
            </Box>
            <Stack spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>From</Typography>
                <Typography variant="body2" noWrap title={trip.origin} sx={{ fontWeight: 600 }}>
                  {trip.origin}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>To</Typography>
                <Typography variant="body2" noWrap title={trip.destination} sx={{ fontWeight: 600 }}>
                  {trip.destination}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Meta pills */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <MetaPill icon={CalendarTodayIcon}>{formatDate(trip.scheduledDate)}</MetaPill>
            {trip.scheduledTime && <MetaPill icon={AccessTimeIcon}>{formatTime(trip.scheduledTime)}</MetaPill>}
            <MetaPill icon={PlaceOutlinedIcon}>
              {stopCount} {stopCount === 1 ? 'stop' : 'stops'}
              {hasProgress ? ` · ${completedStops} done` : ''}
            </MetaPill>
            {trip.customer?.companyName && <MetaPill icon={BusinessIcon}>{trip.customer.companyName}</MetaPill>}
          </Box>

          {/* Progress bar for in-progress trips */}
          {hasProgress && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Delivery Progress
                </Typography>
                <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700 }}>
                  {progressPct}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progressPct} color="warning" sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          )}
        </Box>
      </CardActionArea>

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
          px: { xs: 2, sm: 2.5 },
          pl: { xs: 2.5, sm: 3 },
          py: 1.25,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {trip.status === 'completed' && onViewInvoice && (
          <Tooltip title="View Invoice" placement="top">
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<ReceiptLongIcon sx={{ fontSize: 17 }} />}
              onClick={(e) => { e.stopPropagation(); onViewInvoice(trip); }}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Invoice
            </Button>
          </Tooltip>
        )}
        <Button
          size="small"
          variant="contained"
          disableElevation
          endIcon={<ChevronRightIcon />}
          onClick={onView}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2 }}
        >
          View Details
        </Button>
      </Box>
    </Card>
  );
}
