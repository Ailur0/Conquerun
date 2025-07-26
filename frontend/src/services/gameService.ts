import { Territory, LocationUpdate, GameSession } from '../types';
import { calculatePolygonArea, calculateSpeed, isValidPolygon, checkPolygonIntersection, generateUserColor } from '../utils/geospatial';

class GameService {
  private territories: Territory[] = [];
  
  private currentSession: GameSession | null = null;
  private lastLocation: LocationUpdate | null = null;
  private currentPath: [number, number][] = [];

  // Mock data for demo
  private mockTerritories: Territory[] = [
    {
      id: '1',
      ownerId: 'user2',
      ownerUsername: 'Explorer',
      coordinates: [
        [40.7829, -73.9654],
        [40.7839, -73.9654],
        [40.7839, -73.9644],
        [40.7829, -73.9644],
        [40.7829, -73.9654]
      ],
      area: 12000,
      points: 120,
      color: '#EF4444',
      claimedAt: new Date(),
      gameMode: 'free-play'
    },
    {
      id: '2',
      ownerId: 'user3',
      ownerUsername: 'Conqueror',
      coordinates: [
        [40.7819, -73.9664],
        [40.7829, -73.9664],
        [40.7829, -73.9674],
        [40.7819, -73.9674],
        [40.7819, -73.9664]
      ],
      area: 15000,
      points: 150,
      color: '#10B981',
      claimedAt: new Date(),
      gameMode: 'free-play'
    }
  ];

  constructor() {
    this.territories = [...this.mockTerritories];
  }

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

  attemptTerritoryClaimByClosure(userId: string, username: string): {
    success: boolean;
    territory?: Territory;
    points?: number;
    error?: string;
  } {
    if (this.currentPath.length < 4) {
      return { 
        success: false, 
        error: 'Path too short. Walk more to create a larger territory.' 
      };
    }

    // Close the polygon
    const closedPath = [...this.currentPath];
    if (closedPath[0][0] !== closedPath[closedPath.length - 1][0] || 
        closedPath[0][1] !== closedPath[closedPath.length - 1][1]) {
      closedPath.push(closedPath[0]);
    }

    if (!isValidPolygon(closedPath)) {
      return { 
        success: false, 
        error: 'Invalid territory shape. Try creating a closed loop.' 
      };
    }

    // Check for intersections with existing territories
    for (const territory of this.territories) {
      if (checkPolygonIntersection(closedPath, territory.coordinates)) {
        return { 
          success: false, 
          error: 'Territory overlaps with existing claimed area.' 
        };
      }
    }

    const area = calculatePolygonArea(closedPath);
    const points = Math.floor(area / 100); // 1 point per 100 sq meters

    // Minimum area requirement
    if (area < 1000) {
      return { 
        success: false, 
        error: 'Territory too small. Minimum area: 1000 sq meters.' 
      };
    }

    const territory: Territory = {
      id: `territory_${Date.now()}`,
      ownerId: userId,
      ownerUsername: username,
      coordinates: closedPath,
      area,
      points,
      color: generateUserColor(userId),
      claimedAt: new Date(),
      gameMode: this.currentSession?.mode || 'free-play'
    };

    this.territories.push(territory);
    
    // Update session
    if (this.currentSession) {
      this.currentSession.score += points;
      this.currentSession.territoriesClaimed++;
    }

    // Reset current path
    this.currentPath = [];

    return { success: true, territory, points };
  }

  clearCurrentPath(): void {
    this.currentPath = [];
  }

  getCurrentPath(): [number, number][] {
    return [...this.currentPath];
  }

  getTerritories(): Territory[] {
    return [...this.territories];
  }

  getTerritoriesInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Territory[] {
    return this.territories.filter(territory => {
      return territory.coordinates.some(([lat, lng]) =>
        lat >= bounds.south && lat <= bounds.north &&
        lng >= bounds.west && lng <= bounds.east
      );
    });
  }

  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  getUserTerritories(userId: string): Territory[] {
    return this.territories.filter(t => t.ownerId === userId);
  }

  getUserStats(userId: string): {
    totalPoints: number;
    territoriesCount: number;
    totalArea: number;
  } {
    const userTerritories = this.getUserTerritories(userId);
    return {
      totalPoints: userTerritories.reduce((sum, t) => sum + t.points, 0),
      territoriesCount: userTerritories.length,
      totalArea: userTerritories.reduce((sum, t) => sum + t.area, 0)
    };
  }
}

export const gameService = new GameService();