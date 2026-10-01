import { Box, Typography, Divider } from '@mui/material';

/**
 * Section header used inside multi-section forms (Register New Customer,
 * Driver, Trip, etc.) - bold uppercase label with a bottom border, matching
 * the reference design ("BASIC INFORMATION", "RESIDENTIAL ADDRESS"...).
 */
export default function FormSection({ title, children, sx }) {
  return (
    <Box sx={{ mb: 3, ...sx }}>
      <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2.5, borderColor: 'primary.main', opacity: 0.4 }} />
      {children}
    </Box>
  );
}
