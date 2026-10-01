import { Chip } from '@mui/material';

/**
 * Consistent status pill used across Customers, Drivers, Trips, and Users.
 * Pass a `colorMap` to override default color mapping per module
 * (e.g. trip statuses vs. active/inactive statuses).
 *
 * Rendered as a soft tonal badge (tinted background + strong text) to match
 * the transport dashboard design, rather than a solid MUI chip.
 */
const DEFAULT_COLOR_MAP = {
  active: 'success',
  inactive: 'default',
  suspended: 'error',
};

// Soft tonal styles per semantic color (light + dark aware).
const TONAL = {
  success: { light: { bg: 'rgba(22,163,74,0.12)', fg: '#15803D' }, dark: { bg: 'rgba(34,197,94,0.16)', fg: '#4ADE80' } },
  warning: { light: { bg: 'rgba(217,119,6,0.14)', fg: '#B45309' }, dark: { bg: 'rgba(245,158,11,0.16)', fg: '#FBBF24' } },
  error: { light: { bg: 'rgba(220,38,38,0.12)', fg: '#B91C1C' }, dark: { bg: 'rgba(248,113,113,0.16)', fg: '#F87171' } },
  info: { light: { bg: 'rgba(14,165,233,0.14)', fg: '#0369A1' }, dark: { bg: 'rgba(56,189,248,0.16)', fg: '#38BDF8' } },
  primary: { light: { bg: 'rgba(37,99,235,0.12)', fg: '#1D4ED8' }, dark: { bg: 'rgba(59,130,246,0.18)', fg: '#60A5FA' } },
  default: { light: { bg: 'rgba(100,116,139,0.14)', fg: '#475569' }, dark: { bg: 'rgba(148,163,184,0.16)', fg: '#CBD5E1' } },
};

export default function StatusChip({ status, colorMap = DEFAULT_COLOR_MAP }) {
  const color = colorMap[status] || 'default';
  const label = String(status || '').replace(/_/g, ' ');
  const tone = TONAL[color] || TONAL.default;

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        textTransform: 'capitalize',
        fontWeight: 700,
        fontSize: 11.5,
        letterSpacing: 0.2,
        borderRadius: 2,
        border: 'none',
        bgcolor: (t) => (t.palette.mode === 'dark' ? tone.dark.bg : tone.light.bg),
        color: (t) => (t.palette.mode === 'dark' ? tone.dark.fg : tone.light.fg),
        '& .MuiChip-label': { px: 1.25 },
      }}
    />
  );
}
