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
      const { latitude, longitude } = req.body;
      const user = req.user.username;
      if (!user || !latitude || !longitude) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Speed check: get last claim for this user
      const last = await Territory.findOne({ user }).sort({ claimedAt: -1 });
      if (last) {
        const distKm = haversine(last.latitude, last.longitude, latitude, longitude);
        const timeHrs = (Date.now() - new Date(last.claimedAt).getTime()) / (1000 * 60 * 60);
        const speed = distKm / (timeHrs || 1e-6); // km/h, avoid div by zero
        if (speed > 15) {
          return res.status(429).json({ error: 'Too fast! Slow down to claim territory.' });
        }
      }

      const territory = new Territory({ user, latitude, longitude });
      await territory.save();
      res.status(201).json(territory);
      // Emit real-time event
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
