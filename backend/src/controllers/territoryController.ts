import mongoose from 'mongoose';
import Territory, { GAME_MODES, GameMode, ITerritory } from '../models/Territory';
import User from '../models/User';
import { Request, Response } from 'express';
import area from '@turf/area';
import kinks from '@turf/kinks';

const MIN_AREA_SQ_METERS = 1000;
const SQ_METERS_PER_POINT = 100;

// Shape sent to clients; `polygon` stays GeoJSON ([lng, lat] positions)
function serializeTerritory(territory: ITerritory, ownerUsername: string) {
  // populated() holds the raw id when `owner` was populated (and is null if that user no longer exists)
  const ownerId = territory.populated('owner') ?? territory.owner;
  return {
    id: territory.id,
    ownerId: ownerId.toString(),
    ownerUsername,
    polygon: territory.polygon,
    area: territory.area,
    points: territory.points,
    gameMode: territory.gameMode,
    claimedAt: territory.createdAt
  };
}

function populatedUsername(territory: ITerritory): string {
  const owner = territory.owner as unknown as { username?: string } | null;
  return owner?.username ?? 'Unknown';
}

// Parses a client-submitted GeoJSON Polygon into a closed, simple polygon suitable for a 2dsphere index
function parseClaimPolygon(polygon: any): { geometry: GeoJSON.Polygon } | { error: string } {
  if (!polygon || polygon.type !== 'Polygon' || !Array.isArray(polygon.coordinates) || polygon.coordinates.length !== 1) {
    return { error: 'Territory must be a GeoJSON Polygon with a single ring' };
  }
  const rawRing = polygon.coordinates[0];
  const validPositions = Array.isArray(rawRing) && rawRing.every((p: any) =>
    Array.isArray(p) && p.length === 2 &&
    Number.isFinite(p[0]) && Number.isFinite(p[1]) &&
    Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90
  );
  if (!validPositions) return { error: 'Territory contains invalid coordinates' };

  // Drop consecutive duplicate positions (GPS can repeat a fix); MongoDB rejects them in 2dsphere geometries
  const ring: GeoJSON.Position[] = rawRing.filter((p: GeoJSON.Position, i: number) =>
    i === 0 || p[0] !== rawRing[i - 1][0] || p[1] !== rawRing[i - 1][1]
  );
  if (ring.length < 4) {
    return { error: 'Path too short. Walk more to create a larger territory.' };
  }
  const [first, last] = [ring[0], ring[ring.length - 1]];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return { error: 'Invalid territory shape. Try creating a closed loop.' };
  }

  const geometry: GeoJSON.Polygon = { type: 'Polygon', coordinates: [ring] };
  if (kinks(geometry).features.length > 0) {
    return { error: 'Invalid territory shape. Your path crosses itself.' };
  }
  return { geometry };
}

export const createTerritory = async (req: Request, res: Response) => {
  try {
    const { polygon, gameMode = 'free-play' } = req.body;
    // @ts-ignore
    const ownerId = req.user.id;

    const parsed = parseClaimPolygon(polygon);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    const { geometry } = parsed;
    if (!GAME_MODES.includes(gameMode)) return res.status(400).json({ error: 'Invalid game mode' });

    const claimedArea = area(geometry);
    if (claimedArea < MIN_AREA_SQ_METERS) {
      return res.status(400).json({ error: `Territory too small. Minimum area: ${MIN_AREA_SQ_METERS} sq meters.` });
    }

    const user = await User.findById(ownerId).select('username');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const overlaps = await Territory.exists({ polygon: { $geoIntersects: { $geometry: geometry } } });
    if (overlaps) {
      return res.status(409).json({ error: 'Territory overlaps with existing claimed area.' });
    }

    const points = Math.floor(claimedArea / SQ_METERS_PER_POINT);
    const territory = await new Territory({
      owner: ownerId,
      polygon: geometry,
      area: claimedArea,
      points,
      gameMode: gameMode as GameMode
    }).save();

    const updatedUser = await User.findByIdAndUpdate(
      ownerId,
      { $inc: { totalPoints: points, claimedTerritories: 1 } },
      { new: true }
    ).select('totalPoints claimedTerritories');

    const payload = serializeTerritory(territory, user.username);
    if (global.io) {
      global.io.emit('territory-claimed', payload);
    }

    res.status(201).json({
      success: true,
      territory: payload,
      user: {
        totalPoints: updatedUser?.totalPoints ?? 0,
        claimedTerritories: updatedUser?.claimedTerritories ?? 0
      }
    });
  } catch (err) {
    console.error('Create Territory Error:', err);
    res.status(500).json({ error: 'Failed to create territory' });
  }
};

export const getTerritories = async (_req: Request, res: Response) => {
  try {
    // Skip documents saved before territories stored a polygon
    const territories = await Territory.find({ polygon: { $exists: true } }).populate('owner', 'username');
    res.json({ territories: territories.map(t => serializeTerritory(t, populatedUsername(t))) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch territories' });
  }
};

export const getTerritory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const territory = await Territory.findById(id).populate('owner', 'username');
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    res.json({ territory: serializeTerritory(territory, populatedUsername(territory)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch territory' });
  }
};

export const deleteTerritory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;
    const territory = await Territory.findById(id);
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    if (territory.owner.toString() !== userId) return res.status(403).json({ error: 'Not authorized' });
    await territory.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete territory' });
  }
};

// --- Territory Contestation and Anti-Cheating ---

// Add global type for Socket.io
import type { Server as SocketIOServer } from 'socket.io';
declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

// In-memory store for last player movement (MVP; use Redis/DB for prod)
const lastMove: Record<string, { lat: number; lng: number; timestamp: number }> = {};

// Helper: calculate distance in meters between two lat/lng
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// How far outside a territory's boundary a player may stand and still contest it (matches the client check)
const CONTEST_RADIUS_METERS = 20;

export const contestTerritory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    // @ts-ignore
    const userId = req.user.id;
    const validLocation = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    if (!validLocation) return res.status(400).json({ error: 'lat/lng required' });
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Territory not found' });
    const territory = await Territory.findById(id);
    if (!territory || !territory.polygon) return res.status(404).json({ error: 'Territory not found' });
    const previousOwnerId = territory.owner;
    if (previousOwnerId.toString() === userId) return res.status(400).json({ error: 'You already own this territory' });

    // --- Anti-cheat: speed check ---
    const now = Date.now();
    const last = lastMove[userId];
    let speed = 0;
    if (last) {
      const dist = haversine(last.lat, last.lng, lat, lng);
      const dt = (now - last.timestamp) / 1000;
      speed = dt > 0 ? dist / dt : 0;
      if (speed > 15) return res.status(429).json({ error: 'Speed too high (possible spoofing)' });
    }
    lastMove[userId] = { lat, lng, timestamp: now };

    // --- Player must be inside the territory (or within CONTEST_RADIUS_METERS of its edge) ---
    // $nearSphere measures distance to the polygon itself, so any point inside it is at distance 0
    const isNearby = await Territory.exists({
      _id: territory._id,
      polygon: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: CONTEST_RADIUS_METERS
        }
      }
    });
    if (!isNearby) return res.status(403).json({ error: 'You must be inside the territory to contest it' });

    const user = await User.findById(userId).select('username');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Transfer ownership only if nobody else took it since we read it, so points move exactly once
    const contested = await Territory.findOneAndUpdate(
      { _id: territory._id, owner: previousOwnerId },
      { owner: userId, createdAt: new Date() },
      { new: true }
    );
    if (!contested) return res.status(409).json({ error: 'Territory was just taken by another player' });

    // The territory's points move with it
    await User.updateOne(
      { _id: previousOwnerId },
      { $inc: { totalPoints: -contested.points, claimedTerritories: -1 } }
    );
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { totalPoints: contested.points, claimedTerritories: 1 } },
      { new: true }
    ).select('totalPoints claimedTerritories');

    const payload = serializeTerritory(contested, user.username);
    if (global.io) {
      global.io.emit('territory-contested', { ...payload, previousOwnerId: previousOwnerId.toString() });
    }

    res.json({
      success: true,
      territory: payload,
      user: {
        totalPoints: updatedUser?.totalPoints ?? 0,
        claimedTerritories: updatedUser?.claimedTerritories ?? 0
      }
    });
  } catch (err) {
    console.error('Contest Territory Error:', err);
    res.status(500).json({ error: 'Failed to contest territory' });
  }
};
