import { Box, Stack, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * Consistent branded page header used across every module: a blue gradient
 * banner with an optional leading icon, title, description, breadcrumb trail,
 * and an actions slot (buttons) on the right. Matches the dashboard header
 * so every list/detail page is visually aligned with the transport theme.
 *
 * Backwards compatible: `title`, `description`, `breadcrumbs`, `actions`
 * behave as before; `icon` is optional.
 */
export default function PageHeader({ title, description, breadcrumbs = [], actions = null, icon = null }) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1.5, fontSize: 13 }}>
          {breadcrumbs.map((bc) =>
            bc.path ? (
              <MuiLink
                key={bc.label}
                component={RouterLink}
                to={bc.path}
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: 13 }}
              >
                {bc.label}
              </MuiLink>
            ) : (
              <Typography key={bc.label} color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
                {bc.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          px: { xs: 2.5, sm: 3.5 },
          py: { xs: 2.5, sm: 3 },
          color: 'common.white',
          background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 55%, #1E3A8A 100%)',
          boxShadow: '0 14px 30px -14px rgba(37,99,235,0.55)',
        }}
      >
        {/* decorative glow */}
        <Box sx={{ position: 'absolute', top: -40, right: -20, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.10)' }} />
        <Box sx={{ position: 'absolute', bottom: -50, right: 90, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(56,189,248,0.18)', filter: 'blur(8px)' }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={2}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            {icon && (
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  flexShrink: 0,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                {icon}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.3 }}>
                {title}
              </Typography>
              {description && (
                <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.82)' }}>
                  {description}
                </Typography>
              )}
            </Box>
          </Stack>
          {actions && (
            <Box
              sx={{
                flexShrink: 0,
                // Make action buttons legible on the blue banner: solid white
                // buttons with blue text; outlined buttons become white-outlined.
                '& .MuiButton-contained': {
                  background: '#FFFFFF',
                  color: '#1E40AF',
                  '&:hover': { background: 'rgba(255,255,255,0.9)' },
                },
                '& .MuiButton-outlined': {
                  color: '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.6)',
                  '&:hover': { borderColor: '#FFFFFF', background: 'rgba(255,255,255,0.12)' },
                },
              }}
            >
              {actions}
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
