import apiClient from './apiClient';

let watchId = null;
let intervalId = null;
let activeTripId = null;

/**
 * Start tracking — sends GPS pings every 30 seconds while a trip is in progress.
 */
export function startTracking(tripId) {
  if (activeTripId === tripId) return; // already tracking this trip
  stopTracking(); // stop any existing tracking

  activeTripId = tripId;

  // Send position immediately
  sendPing(tripId);

  // Then every 30 seconds
  intervalId = setInterval(() => {
    sendPing(tripId);
  }, 30000);
}

/**
 * Stop tracking.
 */
export function stopTracking() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  activeTripId = null;
}

/**
 * Get the currently tracked trip ID.
 */
export function getActiveTrackingTripId() {
  return activeTripId;
}

async function sendPing(tripId) {
  try {
    let latitude, longitude, speed;

    // Check for dev GPS override
    if (window.__GPS_OVERRIDE) {
      latitude = window.__GPS_OVERRIDE.latitude;
      longitude = window.__GPS_OVERRIDE.longitude;
      speed = 0;
    } else if (navigator.geolocation) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 15000,
        });
      });
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      speed = position.coords.speed ? Math.round(position.coords.speed * 3.6 * 10) / 10 : null; // m/s to km/h
    } else {
      return;
    }

    await apiClient.post('/tracking/ping', {
      tripId,
      latitude,
      longitude,
      speed,
    });
  } catch {
    // Silent fail — don't interrupt the driver
  }
}
