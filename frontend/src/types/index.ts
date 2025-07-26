export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  totalPoints: number;
  claimedTerritories: number;
  achievements: Achievement[];
  createdAt: Date;
  isOnline?: boolean;
}

export interface Territory {
  id: string;
  ownerId: string;
  ownerUsername: string;
  coordinates: [number, number][];
  area: number; // in square meters
  points: number;
  color: string;
  claimedAt: Date;
  gameMode: GameMode;
}

export interface GamePath {
  id: string;
  userId: string;
  coordinates: [number, number][];
  startTime: Date;
  isActive: boolean;
  color: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: Date;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  points: number;
  territoriesCount: number;
}

export type GameMode = 'free-play' | 'timed-challenge' | 'team-mode';

export interface GameSession {
  id: string;
  userId: string;
  mode: GameMode;
  startTime: Date;
  endTime?: Date;
  score: number;
  territoriesClaimed: number;
  isActive: boolean;
}

export interface LocationUpdate {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy: number;
  speed?: number;
}

export interface GameStats {
  totalPlayers: number;
  activePlayers: number;
  totalTerritories: number;
  totalArea: number;
}