/**
 * Get the current GPS position from the browser's Geolocation API.
 * In development, checks for window.__GPS_OVERRIDE first (set by the dev panel).
 */
export function getCurrentPosition() {
  return new Promise((resolve) => {
    // Dev override
    if (window.__GPS_OVERRIDE) {
      resolve({ ...window.__GPS_OVERRIDE });
      return;
    }

    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Calculate straight-line distance in km between two GPS points (Haversine formula).
 * Used as fallback if Google API fails.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Get real driving distance in km using Google Distance Matrix Service.
 * Falls back to Haversine if Google is not loaded.
 */
export async function getDrivingDistanceKm(lat1, lon1, lat2, lon2) {
  // Use Google Distance Matrix if available
  if (window.google?.maps?.DistanceMatrixService) {
    try {
      const service = new window.google.maps.DistanceMatrixService();
      const result = await service.getDistanceMatrix({
        origins: [{ lat: lat1, lng: lon1 }],
        destinations: [{ lat: lat2, lng: lon2 }],
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      if (result.rows[0]?.elements[0]?.status === 'OK') {
        return Math.round((result.rows[0].elements[0].distance.value / 1000) * 100) / 100;
      }
    } catch {
      // fallback
    }
  }

  // Fallback to straight-line distance
  return calculateDistanceKm(lat1, lon1, lat2, lon2);
}

/**
 * Reverse geocode coordinates to a place name using Google Geocoding API.
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const geocoder = new window.google.maps.Geocoder();
    const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
    if (result.results?.length > 0) {
      // Get a shorter address (locality + admin area)
      const components = result.results[0].address_components;
      const locality = components.find((c) => c.types.includes('locality') || c.types.includes('sublocality'));
      const district = components.find((c) => c.types.includes('administrative_area_level_2'));
      const province = components.find((c) => c.types.includes('administrative_area_level_1'));
      const parts = [locality?.long_name, district?.long_name, province?.long_name].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : result.results[0].formatted_address;
    }
  } catch {
    // silent
  }
  return null;
}
