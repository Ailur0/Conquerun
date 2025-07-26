import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

type Position = [number, number];
interface Polygon {
  type: 'Polygon';
  coordinates: Position[][];
}


// Returns true if [lat, lng] is inside or within bufferMeters of polygonCoords
export function isPointNearPolygon(lat: number, lng: number, polygonCoords: [number, number][], bufferMeters = 20): boolean {
  const turfPoint = point([lng, lat]);
  const turfPolygon: Polygon = {
    type: 'Polygon',
    coordinates: [polygonCoords.map(([lat, lng]) => [lng, lat] as Position)],
  };
  if (booleanPointInPolygon(turfPoint, turfPolygon)) return true;
  // Simple buffer: check if point is within bufferMeters of any edge
  for (let i = 0; i < polygonCoords.length - 1; i++) {
    const [lat1, lng1] = polygonCoords[i];
    const [lat2, lng2] = polygonCoords[i + 1];
    if (distanceToSegment(lat, lng, lat1, lng1, lat2, lng2) <= bufferMeters) return true;
  }
  return false;
}

// Haversine distance in meters between two points
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Distance from point to segment (in meters)
function distanceToSegment(lat: number, lng: number, lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Convert to cartesian for small distances
  const toXY = (lat: number, lng: number) => [haversine(0, 0, lat, 0), haversine(lat, 0, lat, lng)];
  const [x, y] = toXY(lat, lng);
  const [x1, y1] = toXY(lat1, lng1);
  const [x2, y2] = toXY(lat2, lng2);
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
}
