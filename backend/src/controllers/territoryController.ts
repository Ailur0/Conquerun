import Territory from '../models/Territory';
import { Request, Response } from 'express';

export const createTerritory = async (req: Request, res: Response) => {
  try {
    const { polygon, points } = req.body;
    // @ts-ignore
    const owner = req.user.id;
    if (!polygon) return res.status(400).json({ error: 'Polygon is required' });
    const territory = new Territory({ owner, polygon, points });
    await territory.save();
    res.json({ success: true, territory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create territory' });
  }
};

export const getTerritories = async (_req: Request, res: Response) => {
  try {
    const territories = await Territory.find().populate('owner', 'username');
    res.json({ territories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch territories' });
  }
};

export const getTerritory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const territory = await Territory.findById(id).populate('owner', 'username');
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    res.json({ territory });
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

export const contestTerritory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    // @ts-ignore
    const userId = req.user.id;
    if (lat == null || lng == null) return res.status(400).json({ error: 'lat/lng required' });
    const territory = await Territory.findById(id);
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    if (territory.owner.toString() === userId) return res.status(400).json({ error: 'Already owner' });

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

    // --- Optional: check if player is inside territory polygon (GeoJSON) ---
    // Skipped for now, can add with turf.js or similar

    // Change territory owner
    territory.owner = userId;
    territory.createdAt = new Date();
    await territory.save();

    // Emit Socket.io event (if io is available globally)
    if (global.io) {
      global.io.emit('territory-contested', { id: territory.id, owner: userId });
    }

    res.json({ success: true, territory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to contest territory' });
  }
};
