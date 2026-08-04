import mongoose, { Schema, Model, Document } from "mongoose";

export interface IApiKey extends Document {
  id: string;
  clientName: string;
  key: string;
  credits: number;
  status: "ACTIVE" | "REVOKED";
  createdAt: string;
}

const ApiKeySchema: Schema<IApiKey> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    clientName: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, trim: true },
    credits: { type: Number, required: true, default: 500, min: 0 },
    status: { type: String, enum: ["ACTIVE", "REVOKED"], default: "ACTIVE" },
    createdAt: { type: String, default: () => new Date().toLocaleDateString() },
  },
  {
    timestamps: false, // Using our createdAt string representation for UI compatibility
  }
);

// Check if model already exists in Mongoose registry (prevents re-compilation error on Next.js hot reload)
const ApiKey: Model<IApiKey> = mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

export default ApiKey;
