const mongoose = require('mongoose');

const TerritorySchema = new mongoose.Schema({
  user: { type: String, required: true }, // Replace with ObjectId if you add user accounts
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  claimedAt: { type: Date, default: Date.now },
  score: { type: Number, default: 1 },
});

module.exports = mongoose.model('Territory', TerritorySchema);
