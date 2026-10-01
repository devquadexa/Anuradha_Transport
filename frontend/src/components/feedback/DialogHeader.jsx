import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Shared branded dialog header used by form modals across the app.
 * Renders a subtly tinted blue header band with an optional leading icon
 * badge, a title, an optional subtitle, and a close button.
 */
export default function DialogHeader({ title, subtitle, icon = null, onClose }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        px: 3,
        py: 2.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: (t) =>
          t.palette.mode === 'dark' ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.05)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        {icon && (
          <Box
            sx={{
              width: 42,
              height: 42,
              flexShrink: 0,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary', flexShrink: 0 }}>
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
