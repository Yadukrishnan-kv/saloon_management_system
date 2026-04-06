/**
 * Geolocation utility functions
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Estimate travel duration based on distance (average speed: 30 km/h in city)
 * Returns duration in minutes
 */
const estimateTravelDuration = (distanceKm, avgSpeedKmh = 30) => {
  return Math.ceil((distanceKm / avgSpeedKmh) * 60);
};

/**
 * Check if a coordinate is within a radius
 */
const isWithinRadius = (centerLat, centerLng, pointLat, pointLng, radiusKm) => {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusKm;
};

module.exports = { calculateDistance, estimateTravelDuration, isWithinRadius };
