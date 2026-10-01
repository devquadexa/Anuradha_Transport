import { useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';
import { Box, TextField, InputAdornment, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES, SRI_LANKA_CENTER, SRI_LANKA_BOUNDS } from '../../../config/googleMaps';

const mapContainerStyle = { width: '100%', height: '100%' };

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  minZoom: 6,
};

function parsePlace(place) {
  const comps = place.address_components || [];
  const get = (type) => comps.find((c) => c.types.includes(type))?.long_name || '';

  const city =
    get('locality') ||
    get('administrative_area_level_2') ||
    get('postal_town') ||
    get('administrative_area_level_1') ||
    '';
  const country = get('country') || '';

  const streetNumber = get('street_number');
  const route = get('route');
  const street = [streetNumber, route].filter(Boolean).join(' ');
  const premise = get('premise') || get('subpremise');
  const sublocality =
    get('sublocality') ||
    get('sublocality_level_1') ||
    get('neighborhood') ||
    get('administrative_area_level_3') ||
    '';

  let addressLine1 = '';
  let addressLine2 = '';
  const name = place.name || '';
  const nameIsStreet = name && route && name.toLowerCase().includes(route.toLowerCase());

  if (name && !nameIsStreet && name !== street) {
    addressLine1 = name;
    addressLine2 = [premise, street].filter(Boolean).join(', ') || sublocality;
  } else {
    addressLine1 = [premise, street].filter(Boolean).join(', ') || name || '';
    addressLine2 = sublocality;
  }
  if (!addressLine1) addressLine1 = place.formatted_address || '';

  const loc = place.geometry?.location;
  return {
    addressLine1,
    addressLine2,
    city,
    country,
    latitude: loc ? loc.lat() : null,
    longitude: loc ? loc.lng() : null,
    formattedAddress: place.formatted_address || '',
  };
}

/**
 * Google Places search box only. Calls `onSelect` with parsed address parts.
 * Kept separate from the map so each can be placed full-width in the form
 * (a full-width map avoids the column-width sizing issues of a side map).
 */
export function AddressSearchBox({ onSelect }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  const searchBoxRef = useRef(null);

  const handlePlacesChanged = () => {
    const places = searchBoxRef.current?.getPlaces();
    if (!places || places.length === 0) return;
    const place = places[0];
    if (!place.geometry?.location) return;
    onSelect?.(parsePlace(place));
  };

  const input = (
    <TextField
      placeholder="Search address to auto-fill and pin on the map"
      size="small"
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
      }}
    />
  );

  if (!isLoaded) return input;

  return (
    <StandaloneSearchBox
      onLoad={(ref) => { searchBoxRef.current = ref; }}
      onPlacesChanged={handlePlacesChanged}
      bounds={SRI_LANKA_BOUNDS}
    >
      {input}
    </StandaloneSearchBox>
  );
}

/**
 * Full-width map banner. Rendered as a block that spans the whole section, so
 * there is no narrow column for Google Maps to mis-measure.
 */
export function AddressMap({ position = null, height = 260 }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  const mapRef = useRef(null);

  const center = position || SRI_LANKA_CENTER;
  const zoom = position ? 16 : 8;

  if (mapRef.current && position) {
    mapRef.current.panTo(position);
  }

  const boxSx = {
    width: '100%',
    height,
    borderRadius: 2,
    overflow: 'hidden',
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
  };

  if (!isLoaded) {
    return (
      <Box sx={{ ...boxSx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">Loading map…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={boxSx}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
        onLoad={(map) => { mapRef.current = map; }}
      >
        {position && <Marker position={position} />}
      </GoogleMap>
    </Box>
  );
}
