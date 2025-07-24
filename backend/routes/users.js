const express = require('express');
const Territory = require('../models/Territory');
const User = require('../models/User');
const router = express.Router();

// Get all territories claimed by a user
router.get('/:username/territories', async (req, res) => {
  try {
    const { username } = req.params;
    const territories = await Territory.find({ user: username });
    res.json(territories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Optional) Get user profile info
router.get('/:username/profile', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const claimCount = await Territory.countDocuments({ user: username });
    res.json({ username, claimCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
