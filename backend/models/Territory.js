const mongoose = require('mongoose');

const TerritorySchema = new mongoose.Schema({
  user: { type: String, required: true },
  // Either a GeoJSON Polygon or Point
  geometry: {
    type: { type: String, enum: ['Polygon', 'Point'], required: true },
    coordinates: { type: Array, required: true },
  },
  claimedAt: { type: Date, default: Date.now },
  score: { type: Number, default: 1 },
});

// Create 2dsphere index for geometry
TerritorySchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Territory', TerritorySchema);
