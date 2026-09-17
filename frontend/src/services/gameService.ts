import { Territory, LocationUpdate, GameSession, GameMode } from '../types';
import { calculateSpeed, generateUserColor } from '../utils/geospatial';
import { API_URL, authService } from './authService';

// Territory as returned by the backend (and the `territory-claimed` socket event)
export interface ApiTerritory {
  id: string;
  ownerId: string;
  ownerUsername: string;
  polygon: { type: 'Polygon'; coordinates: [number, number][][] }; // GeoJSON [lng, lat]
  area: number;
  points: number;
  gameMode: GameMode;
  claimedAt: string;
}

// Payload of the `territory-contested` socket event
export interface ContestedTerritoryEvent extends ApiTerritory {
  previousOwnerId: string;
}

// A player's totals after the backend applied a claim or contest
export interface UserTotals {
  totalPoints: number;
  claimedTerritories: number;
}

export const toTerritory = (t: ApiTerritory): Territory => ({
  id: t.id,
  ownerId: t.ownerId,
  ownerUsername: t.ownerUsername,
  coordinates: t.polygon.coordinates[0].map(([lng, lat]) => [lat, lng]),
  area: t.area,
  points: t.points,
  color: generateUserColor(t.ownerId),
  claimedAt: new Date(t.claimedAt),
  gameMode: t.gameMode
});

class GameService {
  private currentSession: GameSession | null = null;
  private lastLocation: LocationUpdate | null = null;
  private currentPath: [number, number][] = [];

  startSession(userId: string, mode: 'free-play' | 'timed-challenge' | 'team-mode'): GameSession {
    this.currentSession = {
      id: `session_${Date.now()}`,
      userId,
      mode,
      startTime: new Date(),
      score: 0,
      territoriesClaimed: 0,
      isActive: true
    };

    return this.currentSession;
  }

  endSession(): GameSession | null {
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.currentSession.isActive = false;
    }
    return this.currentSession;
  }

  updateLocation(location: LocationUpdate): { 
    success: boolean; 
    path: [number, number][]; 
    speedWarning?: boolean;
    error?: string;
  } {
    if (!this.lastLocation) {
      this.lastLocation = location;
      return { success: true, path: this.currentPath };
    }

    const distance = this.calculateDistance(
      this.lastLocation.lat, this.lastLocation.lng,
      location.lat, location.lng
    );

    // Ignore GPS jitter by requiring a minimum movement of 3 meters
    const MIN_MOVEMENT_THRESHOLD = 3; // meters
    if (distance < MIN_MOVEMENT_THRESHOLD) {
      return { success: true, path: this.currentPath };
    }

    // Check speed limit (15 km/h) only after significant movement
    const speed = calculateSpeed(this.lastLocation, location);
    if (speed > 15) {
      return { 
        success: false, 
        path: this.currentPath, 
        speedWarning: true,
        error: 'Speed limit exceeded. Please slow down for safety.' 
      };
    }

    // Add to current path
    this.currentPath.push([location.lat, location.lng]);
    this.lastLocation = location;

    return { 
      success: true, 
      path: this.currentPath,
      speedWarning: false
    };
  }

  

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async fetchTerritories(): Promise<Territory[]> {
    try {
      const response = await fetch(`${API_URL}/territories`);
      if (!response.ok) return [];
      const data: { territories: ApiTerritory[] } = await response.json();
      return data.territories.map(toTerritory);
    } catch (error) {
      console.error('Failed to fetch territories:', error);
      return [];
    }
  }

  // Submits the current path as a closed polygon; the backend validates it, scores it and updates the user's stats
  async attemptTerritoryClaimByClosure(): Promise<{
    success: boolean;
    territory?: Territory;
    points?: number;
    user?: UserTotals;
    error?: string;
  }> {
    if (this.currentPath.length < 4) {
      return {
        success: false,
        error: 'Path too short. Walk more to create a larger territory.'
      };
    }

    // Close the loop and convert [lat, lng] to GeoJSON [lng, lat]
    const ring = this.currentPath.map(([lat, lng]) => [lng, lat]);
    const [first, last] = [ring[0], ring[ring.length - 1]];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push(first);
    }

    try {
      const response = await fetch(`${API_URL}/territories`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({
          polygon: { type: 'Polygon', coordinates: [ring] },
          gameMode: this.currentSession?.mode || 'free-play'
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to claim territory' };
      }

      const territory = toTerritory(data.territory);

      if (this.currentSession) {
        this.currentSession.score += territory.points;
        this.currentSession.territoriesClaimed++;
      }
      this.currentPath = [];

      return { success: true, territory, points: territory.points, user: data.user };
    } catch (error) {
      console.error('Failed to claim territory:', error);
      return { success: false, error: 'Network error while claiming territory.' };
    }
  }

  // Takes over another player's territory; the backend checks the player is inside it and moves its points
  async contestTerritory(territoryId: string, lat: number, lng: number): Promise<{
    success: boolean;
    territory?: Territory;
    user?: UserTotals;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/territories/${territoryId}/contest`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ lat, lng }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to contest territory' };
      }

      const territory = toTerritory(data.territory);

      if (this.currentSession) {
        this.currentSession.score += territory.points;
        this.currentSession.territoriesClaimed++;
      }

      return { success: true, territory, user: data.user };
    } catch (error) {
      console.error('Failed to contest territory:', error);
      return { success: false, error: 'Network error while contesting territory.' };
    }
  }

  clearCurrentPath(): void {
    this.currentPath = [];
  }

  getCurrentPath(): [number, number][] {
    return [...this.currentPath];
  }

  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }
}

export const gameService = new GameService();