import area from '@turf/area';
import { LocationUpdate } from '../types';

// Claim rules enforced by the backend (see backend territoryController)
export const MIN_CLAIM_AREA_SQ_METERS = 1000;
const SQ_METERS_PER_POINT = 100;

// Area and points the backend would award for a walked path, closing the loop back to its start
export const estimateClaim = (path: [number, number][]): { area: number; points: number } => {
  if (path.length < 3) return { area: 0, points: 0 };
  const ring = path.map(([lat, lng]) => [lng, lat]);
  ring.push(ring[0]);
  const claimArea = area({ type: 'Polygon', coordinates: [ring] });
  return { area: claimArea, points: Math.floor(claimArea / SQ_METERS_PER_POINT) };
};

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