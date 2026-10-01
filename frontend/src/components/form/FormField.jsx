import { forwardRef } from 'react';
import { Box, Typography, TextField } from '@mui/material';

/**
 * Label-above-input field matching the reference design: bold label with
 * a red required asterisk, plain input below (placeholder-driven, not a
 * floating label), and italic gray helper/hint text underneath. Wraps
 * MUI TextField so it still works with react-hook-form's Controller.
 */
const FormField = forwardRef(function FormField(
  { label, required = false, hint, error, helperText, sx, ...textFieldProps },
  ref
) {
  const message = error?.message || helperText;

  return (
    <Box sx={sx}>
      {label && (
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>
          {label}
          {required && (
            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
      )}
      <TextField
        {...textFieldProps}
        inputRef={ref}
        fullWidth
        error={!!error}
        helperText={undefined}
      />
      {message && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            fontStyle: error ? 'normal' : 'italic',
            color: error ? 'error.main' : 'text.secondary',
          }}
        >
          {message}
        </Typography>
      )}
      {!message && hint && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
});

export default FormField;
