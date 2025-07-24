const express = require('express');
const Territory = require('../models/Territory');
const router = express.Router();

// Claim a territory
router.post('/claim', async (req, res) => {
  try {
    const { user, latitude, longitude } = req.body;
    if (!user || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const territory = new Territory({ user, latitude, longitude });
    await territory.save();
    res.status(201).json(territory);
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

module.exports = router;
