import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Box,
  Divider,
  Stack,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotesIcon from '@mui/icons-material/Notes';
import DialogHeader from '../../../components/feedback/DialogHeader';
import { AddressSearchBox, AddressMap } from './AddressAutocomplete';
import { useDivisions } from '../hooks/useCustomers';

const contactPersonSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({ 'string.empty': 'Name is required' }),
  phone: Joi.string().trim().allow('').max(20),
  email: Joi.string().email({ tlds: false }).allow(''),
});

const customerSchema = Joi.object({
  companyName: Joi.string().trim().min(1).max(150).required(),
  email: Joi.string().email({ tlds: false }).allow(''),
  phone: Joi.string().trim().min(7).max(20).required(),
  addressLine1: Joi.string().trim().allow('').max(255),
  addressLine2: Joi.string().trim().allow('').max(255),
  city: Joi.string().trim().allow('').max(100),
  country: Joi.string().trim().max(100).default('Sri Lanka'),
  status: Joi.string().valid('active', 'inactive').required(),
  divisionId: Joi.number().integer().positive().allow('', null),
  notes: Joi.string().trim().allow('').max(2000),
  contactPersons: Joi.array().items(contactPersonSchema).max(3),
});

const DEFAULTS = {
  companyName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: 'Sri Lanka',
  status: 'active',
  divisionId: '',
  notes: '',
  contactPersons: [],
};

export default function CustomerFormDialog({ open, customer = null, submitting = false, onSubmit, onClose }) {
  const isEdit = !!customer;
  const { data: divisions = [] } = useDivisions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: joiResolver(customerSchema, { abortEarly: false, stripUnknown: true }), defaultValues: DEFAULTS });

  const { fields, append, remove } = useFieldArray({ control, name: 'contactPersons' });

  // Marker position for the address map preview.
  const [addressPos, setAddressPos] = useState(null);

  useEffect(() => {
    if (open) {
      setAddressPos(null);
      reset(customer ? { ...DEFAULTS, ...customer, divisionId: customer.divisionId || '', contactPersons: customer.contactPersons || [] } : DEFAULTS);
    }
  }, [open, customer, reset]);

  // When a Google Places suggestion is selected, auto-fill both address lines
  // + city and move the map preview marker.
  const handleAddressSelect = ({ addressLine1, addressLine2, city, country, latitude, longitude }) => {
    setValue('addressLine1', addressLine1 || '', { shouldValidate: true });
    setValue('addressLine2', addressLine2 || '', { shouldValidate: true });
    if (city) setValue('city', city, { shouldValidate: true });
    if (country) setValue('country', country, { shouldValidate: true });
    if (latitude != null && longitude != null) setAddressPos({ lat: latitude, lng: longitude });
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
          {title}
        </Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogHeader
        icon={<BusinessIcon />}
        title={isEdit ? 'Edit Customer' : 'New Customer'}
        subtitle={isEdit ? 'Update customer information below' : 'Fill in the details to add a new customer'}
        onClose={onClose}
      />

      <DialogContent sx={{ px: 3, py: 3, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {/* Section: Company Details */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader icon={BusinessIcon} title="Company Details" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12}>
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Company Name"
                    fullWidth
                    size="small"
                    error={!!errors.companyName}
                    helperText={errors.companyName?.message}
                    placeholder="e.g., ABC Transport Ltd"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    fullWidth
                    size="small"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    placeholder="+94 71 234 5678"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    fullWidth
                    size="small"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    placeholder="info@company.com"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Status" fullWidth size="small">
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="divisionId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Division" fullWidth size="small">
                    <MenuItem value="">— None —</MenuItem>
                    {divisions.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section: Contact Persons */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <PersonIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                  Contact Persons
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Maximum 3 contacts
                </Typography>
              </Box>
            </Box>
            {fields.length < 3 && (
              <Button size="small" startIcon={<AddIcon />} onClick={() => append({ name: '', phone: '', email: '' })}>
                Add
              </Button>
            )}
          </Box>

          <Stack spacing={2}>
            {fields.map((item, index) => (
              <Box key={item.id} sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    Contact #{index + 1}
                  </Typography>
                  <IconButton size="small" onClick={() => remove(index)} color="error">
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <Controller
                      name={`contactPersons.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Name"
                          fullWidth
                          size="small"
                          error={!!errors.contactPersons?.[index]?.name}
                          helperText={errors.contactPersons?.[index]?.name?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name={`contactPersons.${index}.phone`}
                      control={control}
                      render={({ field }) => <TextField {...field} label="Phone" fullWidth size="small" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name={`contactPersons.${index}.email`}
                      control={control}
                      render={({ field }) => <TextField {...field} label="Email" fullWidth size="small" />}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            {fields.length === 0 && (
              <Box sx={{ py: 3, textAlign: 'center', borderRadius: 1.5, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  No contact persons added yet.
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Section: Address */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader icon={LocationOnIcon} title="Address" subtitle="Search an address to auto-fill the fields" />

          <Stack spacing={2}>
            {/* Full-width search */}
            <AddressSearchBox onSelect={handleAddressSelect} />

            {/* Full-width map banner */}
            <AddressMap position={addressPos} height={240} />

            {/* Address fields */}
            <Controller
              name="addressLine1"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Address Line 1" fullWidth size="small" placeholder="Street address" />
              )}
            />
            <Controller
              name="addressLine2"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Address Line 2" fullWidth size="small" placeholder="Apartment, area, etc. (optional)" />
              )}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="city" control={control} render={({ field }) => <TextField {...field} label="City" fullWidth size="small" />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Country" fullWidth size="small" />}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* Section: Notes */}
        <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <SectionHeader icon={NotesIcon} title="Additional Notes" />
          <Controller
            name="notes"
            control={control}
            render={({ field }) => <TextField {...field} label="Notes" fullWidth multiline minRows={3} size="small" />}
          />
        </Paper>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} variant="outlined" fullWidth={isMobile}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(
            (values) => {
              const payload = {
                ...values,
                divisionId: values.divisionId ? Number(values.divisionId) : null,
                latitude: addressPos?.lat ?? null,
                longitude: addressPos?.lng ?? null,
              };
              onSubmit(payload);
            },
            (validationErrors) => {
              console.error('[FORM ERRORS]', validationErrors);
            }
          )}
          variant="contained"
          disabled={submitting}
          fullWidth={isMobile}
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
