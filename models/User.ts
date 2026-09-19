import mongoose, { Schema, type Model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  marketingOptIn: boolean;
  /** Denormalised for the admin customer list; refreshed when orders are paid. */
  stats: { orderCount: number; totalSpent: number; lastOrderAt?: Date };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: { type: String, trim: true },
    marketingOptIn: { type: Boolean, default: true },
    stats: {
      orderCount: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      lastOrderAt: Date,
    },
  },
  { timestamps: true },
);

UserSchema.index({ phone: 1 });
UserSchema.index({ createdAt: -1 });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
