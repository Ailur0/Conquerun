const express = require('express');
const Territory = require('../models/Territory');
const auth = require('../middleware/auth');
const router = express.Router();

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = (io) => {
  // Claim a territory (protected)
  router.post('/claim', auth, async (req, res) => {
  try {
    const user = req.user.username;
    // Polygon claim
    if (Array.isArray(req.body.polygon)) {
      const coords = req.body.polygon;
      // Validate: at least 4 points, closed loop
      if (coords.length < 4 || coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
        return res.status(400).json({ error: 'Invalid polygon: must be closed and have at least 4 points' });
      }
      // Collision check: any intersection?
      const collision = await Territory.findOne({
        geometry: {
          $geoIntersects: {
            $geometry: { type: 'Polygon', coordinates: [coords] }
          }
        }
      });
      if (collision) {
        return res.status(409).json({ error: 'Polygon intersects with existing territory!' });
      }
      // Save polygon
      const territory = new Territory({
        user,
        geometry: { type: 'Polygon', coordinates: [coords] },
        claimedAt: new Date(),
        score: Math.max(1, Math.round(coords.length / 5)),
      });
      await territory.save();
      res.status(201).json(territory);
      io.emit('territoryClaimed', territory);
      // Emit updated leaderboard
      const leaderboard = await Territory.aggregate([
        { $group: { _id: '$user', claims: { $sum: 1 } } },
        { $sort: { claims: -1 } },
        { $limit: 10 },
      ]);
      io.emit('leaderboardUpdate', leaderboard);
      return;
    }
    // Point claim (legacy)
    const { latitude, longitude } = req.body;
    if (!user || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Speed check: get last claim for this user
    const last = await Territory.findOne({ user }).sort({ claimedAt: -1 });
    if (last && last.geometry && last.geometry.type === 'Point') {
      const haversine = (lat1, lon1, lat2, lon2) => {
        const toRad = deg => deg * Math.PI / 180;
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      const distKm = haversine(last.geometry.coordinates[1], last.geometry.coordinates[0], latitude, longitude);
      const timeHrs = (Date.now() - new Date(last.claimedAt).getTime()) / (1000 * 60 * 60);
      const speed = distKm / (timeHrs || 1e-6);
      if (speed > 15) {
        return res.status(429).json({ error: 'Too fast! Slow down to claim territory.' });
      }
    }
    const territory = new Territory({
      user,
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      claimedAt: new Date(),
      score: 1,
    });
    await territory.save();
    res.status(201).json(territory);
    io.emit('territoryClaimed', territory);
    // Emit updated leaderboard
    const leaderboard = await Territory.aggregate([
      { $group: { _id: '$user', claims: { $sum: 1 } } },
      { $sort: { claims: -1 } },
      { $limit: 10 },
    ]);
    io.emit('leaderboardUpdate', leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  // Get all claimed territories
  router.get('/', async (req, res) => {
    try {
      const territories = await Territory.find();
      res.json(territories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get leaderboard (top users by claims)
  router.get('/leaderboard', async (req, res) => {
    try {
      const leaderboard = await Territory.aggregate([
        { $group: { _id: '$user', claims: { $sum: 1 } } },
        { $sort: { claims: -1 } },
        { $limit: 10 },
      ]);
      res.json(leaderboard);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
