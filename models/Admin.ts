import mongoose, { Schema, type Model } from "mongoose";

export type AdminRole = "owner" | "manager" | "staff";

export interface IAdmin {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bakery staff live in their own collection with their own session cookie, so a
 * compromised storefront account can never reach the admin panel.
 */
const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["owner", "manager", "staff"],
      default: "staff",
    },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const Admin: Model<IAdmin> =
  (mongoose.models.Admin as Model<IAdmin>) ||
  mongoose.model<IAdmin>("Admin", AdminSchema);
