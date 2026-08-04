import mongoose, { Schema, Model, Document } from "mongoose";

export interface IReseller extends Document {
  username: string;
  password?: string;
  credits: number;
  totalWhitelisted: number;
  createdAt: string;
}

const ResellerSchema: Schema<IReseller> = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: false },
    credits: { type: Number, required: true, default: 100, min: 0 },
    totalWhitelisted: { type: Number, required: true, default: 0, min: 0 },
    createdAt: { type: String, default: () => new Date().toLocaleDateString() },
  },
  {
    timestamps: false,
  }
);

// Prevent model overwrite error on Next.js hot reload
const Reseller: Model<IReseller> = mongoose.models.Reseller || mongoose.model<IReseller>("Reseller", ResellerSchema);

export default Reseller;
