export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getDistanceText(station, userLocation) {
  if (!userLocation) return null;
  const dist = haversineDistance(
    userLocation.lat,
    userLocation.lng,
    station.lat,
    station.lng,
  );
  if (dist < 1) {
    return `${(dist * 1000).toFixed(0)} m`;
  }
  return `${dist.toFixed(1)} km`;
}
