const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * Geocode a free-text address into { latitude, longitude } using the Google
 * Geocoding API. Returns null if no API key is configured, the address is
 * empty, or geocoding fails / finds no match.
 */
async function geocodeAddress(addressText) {
  if (!GOOGLE_MAPS_API_KEY || !addressText || !addressText.trim()) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressText)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const loc = data.results[0].geometry?.location;
      if (loc) {
        return { latitude: loc.lat, longitude: loc.lng };
      }
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = { geocodeAddress };
