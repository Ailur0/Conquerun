import mongoose, { Document, Schema } from 'mongoose';

export const GAME_MODES = ['free-play', 'timed-challenge', 'team-mode'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export interface ITerritory extends Document {
  owner: mongoose.Types.ObjectId;
  polygon: GeoJSON.Polygon;
  area: number; // square meters
  points: number;
  gameMode: GameMode;
  createdAt: Date;
}

const TerritorySchema = new Schema<ITerritory>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  polygon: {
    type: { type: String, enum: ['Polygon'], required: true },
    coordinates: { type: [[[Number]]], required: true }
  },
  area: { type: Number, required: true },
  points: { type: Number, default: 0 },
  gameMode: { type: String, enum: GAME_MODES, default: 'free-play' },
  createdAt: { type: Date, default: Date.now }
});

// Enables $geoIntersects overlap checks between claims
TerritorySchema.index({ polygon: '2dsphere' });

export default mongoose.model<ITerritory>('Territory', TerritorySchema);
