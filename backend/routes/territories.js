const express = require('express');
const Territory = require('../models/Territory');
const auth = require('../middleware/auth');
const router = express.Router();

module.exports = (io) => {
  // Claim a territory (protected)
  router.post('/claim', auth, async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const user = req.user.username;
      if (!user || !latitude || !longitude) {
        return res.status(400).json({ error: 'Missing required fields' });
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
