import { Card, CardContent, Stack, Typography, Box, Avatar } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

/**
 * Dashboard/summary metric card. `trend` is optional: positive number
 * renders green with an up arrow, negative renders red with a down arrow.
 */
export default function StatCard({ label, value, icon, color = 'primary', trend = null, loading = false }) {
  const isPositive = trend != null && trend >= 0;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>
              {loading ? '—' : value}
            </Typography>
            {trend != null && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                {isPositive ? (
                  <TrendingUpIcon fontSize="small" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" />
                )}
                <Typography variant="caption" color={isPositive ? 'success.main' : 'error.main'} fontWeight={700}>
                  {Math.abs(trend)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last month
                </Typography>
              </Stack>
            )}
          </Box>
          {icon && (
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: (theme) => `${theme.palette[color].main}1A`,
                color: `${color}.main`,
                width: 44,
                height: 44,
              }}
            >
              {icon}
            </Avatar>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
