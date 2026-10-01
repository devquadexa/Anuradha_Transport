const env = require('../config/env');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * Gets real driving distance between two GPS coordinates using Google Directions API.
 * Falls back to Haversine calculation if Google API fails or no key configured.
 */
async function getDrivingDistanceKm(lat1, lon1, lat2, lon2) {
  // Try Google Directions API first
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lon1}&destination=${lat2},${lon2}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK' && data.routes?.length > 0) {
        const meters = data.routes[0].legs[0].distance.value;
        return Math.round((meters / 1000) * 100) / 100;
      }
    } catch {
      // fall through to OSRM
    }
  }

  // Fallback: OSRM (free, no key needed)
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes?.length > 0) {
      return Math.round((data.routes[0].distance / 1000) * 100) / 100;
    }
  } catch {
    // fall through to haversine
  }

  // Final fallback: Haversine (straight-line)
  return haversineKm(lat1, lon1, lat2, lon2);
}

function haversineKm(lat1, lon1, lat2, lon2) {
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

module.exports = { getDrivingDistanceKm };
