import { LocationUpdate } from '../types';

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const calculatePolygonArea = (coordinates: [number, number][]): number => {
  if (coordinates.length < 3) return 0;

  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [lat1, lng1] = coordinates[i];
    const [lat2, lng2] = coordinates[j];
    
    area += (lng2 - lng1) * (lat2 + lat1);
  }

  // Convert to square meters (approximate)
  area = Math.abs(area) * 111139 * 111139 / 2;
  return area;
};

export const calculateSpeed = (
  location1: LocationUpdate,
  location2: LocationUpdate
): number => {
  const distance = calculateDistance(
    location1.lat,
    location1.lng,
    location2.lat,
    location2.lng
  );
  const timeDiff = (location2.timestamp.getTime() - location1.timestamp.getTime()) / 1000;
  return timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0; // km/h
};

export const isValidPolygon = (coordinates: [number, number][]): boolean => {
  if (coordinates.length < 3) return false;
  
  // Check if polygon is closed
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  return first[0] === last[0] && first[1] === last[1];
};

export const checkPolygonIntersection = (
  poly1: [number, number][],
  poly2: [number, number][]
): boolean => {
  // Simplified intersection check - in production would use more sophisticated algorithm
  for (const point of poly1) {
    if (isPointInPolygon(point, poly2)) {
      return true;
    }
  }
  return false;
};

export const isPointInPolygon = (
  point: [number, number],
  polygon: [number, number][]
): boolean => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

export const generateUserColor = (userId: string): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
  }
  
  return colors[Math.abs(hash) % colors.length];
};