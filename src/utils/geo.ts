// Geo utilities: Haversine distance formula & city coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const KNOWN_CITIES: Record<string, Coordinates> = {
  'Kathmandu': { latitude: 27.7172, longitude: 85.3240 },
  'Lalitpur': { latitude: 27.6710, longitude: 85.3216 },
  'Bhaktapur': { latitude: 27.6710, longitude: 85.4298 },
  'Pokhara': { latitude: 28.2096, longitude: 83.9856 },
  'Birgunj': { latitude: 27.0128, longitude: 84.8774 },
  'Chitwan': { latitude: 27.5341, longitude: 84.4525 },
  'Butwal': { latitude: 27.7006, longitude: 83.4484 },
  'Dharan': { latitude: 26.8126, longitude: 87.2834 },
  'Biratnagar': { latitude: 26.4525, longitude: 87.2718 },
  'Hetauda': { latitude: 27.4285, longitude: 85.0326 }
};

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
