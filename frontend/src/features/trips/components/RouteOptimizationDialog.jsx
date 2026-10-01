import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import StraightenIcon from '@mui/icons-material/Straighten';
import NavigationIcon from '@mui/icons-material/Navigation';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES, SRI_LANKA_CENTER } from '../../../config/googleMaps';

const mapContainerStyle = { width: '100%', height: '280px' };

export default function RouteOptimizationDialog({ open, trip, onClose, onStartTrip }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [loading, setLoading] = useState(true);
  const [directions, setDirections] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !trip || !isLoaded || !window.google) return;

    const calculateRoute = async () => {
      setLoading(true);
      setError(null);
      setDirections(null);
      setRoutes([]);
      setSelectedRoute(0);

      try {
        const directionsService = new window.google.maps.DirectionsService();
        const stops = trip.stops || [];

        if (stops.length === 0) {
          setError('No stops defined for this trip');
          setLoading(false);
          return;
        }

        // Only calculate route to the NEXT pending stop
        const nextPendingStop = stops.find((s) => s.status !== 'delivered');
        if (!nextPendingStop) {
          setError('All stops are already delivered');
          setLoading(false);
          return;
        }

        // Find where we're coming from (last delivered stop, or origin)
        const nextIndex = stops.findIndex((s) => s.id === nextPendingStop.id);
        const previousStop = nextIndex > 0 ? stops[nextIndex - 1] : null;
        const originName = previousStop ? previousStop.locationName : trip.origin;

        const origin = originName + ', Sri Lanka';
        const destination = nextPendingStop.locationName + ', Sri Lanka';

        const result = await directionsService.route({
          origin,
          destination,
          provideRouteAlternatives: true,
          travelMode: window.google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
          },
          region: 'lk',
        });

        if (result.status === 'OK') {
          setDirections(result);

          const parsed = result.routes.map((route, idx) => {
            let totalM = 0;
            let totalS = 0;
            let totalTrafficS = 0;
            route.legs.forEach((leg) => {
              totalM += leg.distance.value;
              totalS += leg.duration.value;
              // duration_in_traffic is available when departureTime is set
              totalTrafficS += leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value;
            });

            const trafficDelay = totalTrafficS - totalS;
            let trafficLevel = 'light';
            if (trafficDelay > 600) trafficLevel = 'moderate'; // >10 min delay
            if (trafficDelay > 1800) trafficLevel = 'heavy'; // >30 min delay

            // Extract a midpoint from the route path to use as waypoint in Google Maps URL
            const overviewPath = route.overview_path;
            let midpoint = null;
            if (overviewPath && overviewPath.length > 2) {
              const midIdx = Math.floor(overviewPath.length / 2);
              midpoint = { lat: overviewPath[midIdx].lat(), lng: overviewPath[midIdx].lng() };
            }

            return {
              index: idx,
              summary: route.summary || `Route ${idx + 1}`,
              distance: (totalM / 1000).toFixed(1),
              distanceValue: totalM,
              duration: formatTime(totalS),
              durationInTraffic: formatTime(totalTrafficS),
              trafficDelay: trafficDelay > 60 ? `+${formatTime(trafficDelay)}` : null,
              trafficLevel,
              warnings: route.warnings || [],
              midpoint,
            };
          });

          parsed.sort((a, b) => a.distanceValue - b.distanceValue);
          setRoutes(parsed);
          setSelectedRoute(parsed[0]?.index || 0);
        } else {
          setError('Could not find route. Check location names.');
        }
      } catch {
        setError('Failed to calculate route.');
      }
      setLoading(false);
    };

    calculateRoute();
  }, [open, trip, isLoaded]);

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  }

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NavigationIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Suggested Route</Typography>
            <Typography variant="caption" color="text.secondary">Best route calculated for minimum distance</Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ px: 3 }}>
        {loading && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Finding the best route...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="error">{error}</Typography>
          </Box>
        )}

        {!loading && directions && routes.length > 0 && (
          <Stack spacing={2}>
            {/* Map */}
            <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={SRI_LANKA_CENTER}
                zoom={8}
                options={{ disableDefaultUI: true, zoomControl: true }}
              >
                <DirectionsRenderer directions={directions} routeIndex={selectedRoute} />
              </GoogleMap>
            </Box>

            {/* Route options */}
            <Typography variant="subtitle2" fontWeight={700}>
              {routes.length > 1 ? `${routes.length} routes available:` : 'Best route:'}
            </Typography>

            <Stack spacing={1}>
              {routes.map((route, i) => (
                <Paper
                  key={route.index}
                  elevation={0}
                  onClick={() => setSelectedRoute(route.index)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: selectedRoute === route.index ? 'primary.main' : 'divider',
                    bgcolor: selectedRoute === route.index ? 'primary.50' : 'background.paper',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.light' },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="body2" fontWeight={600} noWrap>
                          via {route.summary}
                        </Typography>
                        {i === 0 && <Chip label="Shortest" size="small" color="success" sx={{ height: 20, fontSize: 10 }} />}
                      </Stack>
                      {/* Time & Traffic */}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                        <Chip
                          size="small"
                          label={route.durationInTraffic}
                          variant="outlined"
                          sx={{ height: 22, fontSize: 11 }}
                        />
                        {route.trafficDelay && (
                          <Chip
                            size="small"
                            label={`Traffic: ${route.trafficDelay}`}
                            color={route.trafficLevel === 'heavy' ? 'error' : route.trafficLevel === 'moderate' ? 'warning' : 'success'}
                            sx={{ height: 22, fontSize: 10 }}
                          />
                        )}
                        {!route.trafficDelay && (
                          <Chip
                            size="small"
                            label="No traffic"
                            color="success"
                            variant="outlined"
                            sx={{ height: 22, fontSize: 10 }}
                          />
                        )}
                      </Stack>
                      {route.warnings.length > 0 && (
                        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                          ⚠️ {route.warnings[0]}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      icon={<StraightenIcon />}
                      label={`${route.distance} km`}
                      size="small"
                      color={selectedRoute === route.index ? 'primary' : 'default'}
                      variant={selectedRoute === route.index ? 'filled' : 'outlined'}
                      sx={{ fontSize: 12, height: 28, fontWeight: 700, flexShrink: 0 }}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button onClick={() => {
          const selected = routes.find((r) => r.index === selectedRoute);
          onStartTrip(selected?.midpoint || null);
        }} variant="contained" startIcon={<NavigationIcon />} disabled={loading || !!error}>
          Start Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
}
