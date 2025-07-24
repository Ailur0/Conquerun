import mongoose, { Document, Schema } from 'mongoose';

export interface ITerritory extends Document {
  owner: mongoose.Types.ObjectId;
  polygon: GeoJSON.Polygon;
  points: number;
  createdAt: Date;
}

const TerritorySchema = new Schema<ITerritory>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  polygon: { type: Object, required: true }, // GeoJSON Polygon
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITerritory>('Territory', TerritorySchema);
