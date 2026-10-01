import { Box, Stack, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Dialog header matching the reference design: bold title on the left,
 * a close (X) icon on the right, and a full-width divider beneath -
 * used by every "Register/Edit ..." form dialog.
 */
export default function FormDialogHeader({ title, onClose }) {
  return (
    <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}
