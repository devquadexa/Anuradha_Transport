import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Stack, Chip, Paper, Avatar, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SpeedIcon from '@mui/icons-material/Speed';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import PageHeader from '../../../components/layout-elements/PageHeader';
import apiClient from '../../../services/apiClient';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES, SRI_LANKA_CENTER } from '../../../config/googleMaps';

const mapContainerStyle = { width: '100%', height: 'calc(100vh - 200px)', minHeight: '400px' };

export default function LiveTrackingPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [positions, setPositions] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await apiClient.get('/tracking/live');
      setPositions(res.data.data || []);
      setLastRefresh(new Date());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    // Refresh every 15 seconds
    intervalRef.current = setInterval(fetchPositions, 15000);
    return () => clearInterval(intervalRef.current);
  }, [fetchPositions]);

  return (
    <Box>
      <PageHeader
        icon={<GpsFixedIcon fontSize="medium" />}
        title="Live Tracking"
        description="Real-time location of all active drivers on the road."
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${positions.length} active`}
              color="success"
              size="small"
              icon={<LocalShippingIcon />}
            />
            {lastRefresh && (
              <Typography variant="caption" color="text.secondary">
                Updated {lastRefresh.toLocaleTimeString()}
              </Typography>
            )}
            <IconButton size="small" onClick={fetchPositions} title="Refresh now">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      />

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={SRI_LANKA_CENTER}
            zoom={8}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
          >
            {positions.map((pos) => (
              <Marker
                key={pos.tripId}
                position={{ lat: pos.position.latitude, lng: pos.position.longitude }}
                onClick={() => setSelectedDriver(pos)}
                title={pos.driver.name}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                }}
              />
            ))}

            {selectedDriver && (
              <InfoWindow
                position={{ lat: selectedDriver.position.latitude, lng: selectedDriver.position.longitude }}
                onCloseClick={() => setSelectedDriver(null)}
              >
                {/* Google InfoWindow always renders on a white background, so
                    force dark text here regardless of the app's dark mode. */}
                <Box sx={{ p: 0.5, minWidth: 180, color: '#1f2937' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#1976d2', color: '#fff' }}>
                      {selectedDriver.driver.name.split(' ').map((n) => n[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#111827' }}>{selectedDriver.driver.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>{selectedDriver.driver.phone}</Typography>
                    </Box>
                  </Stack>
                  <Stack spacing={0.5} sx={{ color: '#374151' }}>
                    <Typography variant="caption" sx={{ color: 'inherit' }}>
                      <strong>Trip:</strong> {selectedDriver.tripNumber}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'inherit' }}>
                      <strong>Route:</strong> {selectedDriver.origin} → {selectedDriver.destination}
                    </Typography>
                    {selectedDriver.driver.vehicleNumber && (
                      <Typography variant="caption" sx={{ color: 'inherit' }}>
                        <strong>Vehicle:</strong> {selectedDriver.driver.vehicleNumber}
                      </Typography>
                    )}
                    {selectedDriver.position.speed != null && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <SpeedIcon sx={{ fontSize: 14, color: '#374151' }} />
                        <Typography variant="caption" fontWeight={600} sx={{ color: 'inherit' }}>
                          {selectedDriver.position.speed} km/h
                        </Typography>
                      </Stack>
                    )}
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Last seen: {new Date(selectedDriver.position.recordedAt).toLocaleTimeString()}
                    </Typography>
                  </Stack>
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>Loading map...</Typography>
          </Box>
        )}
      </Paper>

      {/* Active drivers list below map */}
      {positions.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {positions.map((pos) => (
            <Paper key={pos.tripId} elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'primary.main' }}>
                    {pos.driver.name.split(' ').map((n) => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{pos.driver.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pos.tripNumber} • {pos.origin} → {pos.destination}
                    </Typography>
                  </Box>
                </Stack>
                <Stack alignItems="flex-end">
                  {pos.position.speed != null && (
                    <Chip size="small" icon={<SpeedIcon />} label={`${pos.position.speed} km/h`} sx={{ height: 22, fontSize: 11 }} />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(pos.position.recordedAt).toLocaleTimeString()}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {positions.length === 0 && (
        <Paper elevation={0} sx={{ mt: 2, p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <LocalShippingIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No active trips right now. Drivers will appear here once they start a trip.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
