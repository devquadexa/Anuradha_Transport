import { useState, useRef, useCallback } from 'react';
import { Box, Typography, Chip, IconButton, Collapse, Paper, Stack, Button, TextField, InputAdornment } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES, SRI_LANKA_CENTER, SRI_LANKA_BOUNDS } from '../../config/googleMaps';

const PRESETS = [
  { label: 'Katunayake', lat: 7.1676, lng: 79.8842 },
  { label: 'Colombo', lat: 6.9344, lng: 79.8428 },
  { label: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { label: 'Galle', lat: 6.0535, lng: 80.2210 },
  { label: 'Halawatha', lat: 6.8745, lng: 79.8875 },
  { label: 'Kurunegala', lat: 7.4863, lng: 80.3647 },
  { label: 'Jaffna', lat: 9.6615, lng: 80.0255 },
  { label: 'Matara', lat: 5.9485, lng: 80.5353 },
];

const mapOptions = {
  restriction: { latLngBounds: SRI_LANKA_BOUNDS, strictBounds: true },
  minZoom: 7,
  disableDefaultUI: true,
  zoomControl: true,
};

export default function GpsOverridePanel() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState(window.__GPS_OVERRIDE || null);
  const [searchText, setSearchText] = useState('');
  const mapRef = useRef(null);

  const handleSetPosition = useCallback((e) => {
    const pos = { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
    setPosition(pos);
    window.__GPS_OVERRIDE = pos;
  }, []);

  const handlePreset = (preset) => {
    const pos = { latitude: preset.lat, longitude: preset.lng };
    setPosition(pos);
    window.__GPS_OVERRIDE = pos;
    if (mapRef.current) {
      mapRef.current.panTo({ lat: preset.lat, lng: preset.lng });
      mapRef.current.setZoom(13);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim() || !window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    try {
      const result = await geocoder.geocode({ address: searchText + ', Sri Lanka' });
      if (result.results?.length > 0) {
        const loc = result.results[0].geometry.location;
        const pos = { latitude: loc.lat(), longitude: loc.lng() };
        setPosition(pos);
        window.__GPS_OVERRIDE = pos;
        if (mapRef.current) {
          mapRef.current.panTo(loc);
          mapRef.current.setZoom(13);
        }
      }
    } catch { /* silent */ }
  };

  const handleClear = () => {
    setPosition(null);
    window.__GPS_OVERRIDE = null;
  };

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        borderRadius: 2,
        overflow: 'hidden',
        width: expanded ? 320 : 'auto',
        maxWidth: 'calc(100vw - 32px)',
        opacity: expanded ? 1 : 0.85,
        border: '2px solid',
        borderColor: position ? 'success.main' : 'warning.main',
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 1.5, py: 1, bgcolor: position ? 'success.main' : 'warning.main', color: 'white', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <GpsFixedIcon fontSize="small" />
        <Typography variant="caption" fontWeight={700} sx={{ flexGrow: 1 }}>
          {position ? `GPS: ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}` : 'DEV GPS — Click to set'}
        </Typography>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Stack>

      {/* Expanded content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 1.5 }}>
          {/* Search */}
          <TextField
            placeholder="Search location (e.g., Dambulla)"
            size="small"
            fullWidth
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ mb: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch}>
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Presets */}
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
            {PRESETS.map((p) => (
              <Chip
                key={p.label}
                label={p.label}
                size="small"
                onClick={() => handlePreset(p)}
                color={position?.latitude === p.lat ? 'success' : 'default'}
                variant={position?.latitude === p.lat ? 'filled' : 'outlined'}
                sx={{ height: 22, fontSize: 10 }}
              />
            ))}
          </Stack>

          {/* Mini map */}
          <Box sx={{ height: 180, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={position ? { lat: position.latitude, lng: position.longitude } : SRI_LANKA_CENTER}
                zoom={position ? 12 : 8}
                options={mapOptions}
                onClick={handleSetPosition}
                onLoad={(map) => { mapRef.current = map; }}
              >
                {position && <Marker position={{ lat: position.latitude, lng: position.longitude }} />}
              </GoogleMap>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption">Loading...</Typography>
              </Box>
            )}
          </Box>

          {/* Clear */}
          {position && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClear}
              sx={{ mt: 1 }}
              fullWidth
              variant="outlined"
            >
              Clear (use real GPS)
            </Button>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
