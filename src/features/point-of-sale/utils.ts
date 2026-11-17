import type {
  PointOfSaleLocation,
  UserCoordinates,
} from '@/types/pointsOfSale';

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceInKm(
  from: UserCoordinates,
  to: UserCoordinates
) {
  const earthRadiusKm = 6371;

  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function sortLocationsByDistance(
  locations: PointOfSaleLocation[],
  userCoords: UserCoordinates
) {
  return [...locations]
    .map((location) => ({
      ...location,
      distanceKm: calculateDistanceInKm(userCoords, {
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getNearbyLocations(
  locations: PointOfSaleLocation[],
  userCoords: UserCoordinates,
  maxDistanceKm = 25
) {
  return sortLocationsByDistance(locations, userCoords).filter(
    (location) => location.distanceKm <= maxDistanceKm
  );
}

export function buildGoogleMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}