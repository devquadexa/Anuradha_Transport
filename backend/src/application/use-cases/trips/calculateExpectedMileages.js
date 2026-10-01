const { getDrivingDistanceKm } = require('../../../infrastructure/services/OsrmService');

/**
 * Resolve saved-location coordinates for stops that carry a locationId, and
 * compute expectedMileage (driving distance) between consecutive points,
 * starting from the trip origin.
 *
 * Shared by CreateTripUseCase and UpdateTripUseCase so both produce the same
 * expectedMileage values. Returns a NEW array of stop objects ready to persist
 * (temporary _lat/_lon fields are stripped).
 *
 * @param {Array} stops - incoming stops (may include locationId / locationName)
 * @param {string} originName - the trip origin name
 * @param {object} locationRepository - repo with findById + listActive
 */
async function calculateExpectedMileages(stops = [], originName, locationRepository) {
  // 1. Resolve coordinates for stops with a locationId.
  const resolved = [];
  for (const stop of stops) {
    const s = { ...stop };
    if (stop.locationId && locationRepository) {
      const loc = await locationRepository.findById(stop.locationId);
      if (loc) {
        s.locationId = loc.id;
        s.locationName = s.locationName || loc.name;
        s._lat = loc.latitude;
        s._lon = loc.longitude;
      }
    }
    resolved.push(s);
  }

  // 2. Determine the origin coordinates (match a saved location by name).
  let prevLat = null;
  let prevLon = null;
  if (locationRepository) {
    const allActive = await locationRepository.listActive();
    const originLoc = allActive.find((l) => l.name === originName);
    if (originLoc) {
      prevLat = originLoc.latitude;
      prevLon = originLoc.longitude;
    }
  }

  // 3. Compute expectedMileage leg by leg.
  for (const stop of resolved) {
    const curLat = stop._lat;
    const curLon = stop._lon;

    if (prevLat && prevLon && curLat && curLon) {
      const distance = await getDrivingDistanceKm(prevLat, prevLon, curLat, curLon);
      if (distance !== null) {
        stop.expectedMileage = distance;
      }
    }

    if (curLat && curLon) {
      prevLat = curLat;
      prevLon = curLon;
    }

    delete stop._lat;
    delete stop._lon;
  }

  return resolved;
}

module.exports = { calculateExpectedMileages };
