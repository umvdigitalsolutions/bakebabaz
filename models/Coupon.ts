import mongoose, { Schema, type Model } from "mongoose";

export type CouponType = "percentage" | "fixed" | "free_delivery";

export interface ICoupon {
  _id: mongoose.Types.ObjectId;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount?: number;
  startsAt?: Date;
  expiresAt?: Date;
  usageLimit: number;
  perUserLimit: number;
  usedCount: number;
  categories: mongoose.Types.ObjectId[];
  products: mongoose.Types.ObjectId[];
  appliesToCustomCakes: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["percentage", "fixed", "free_delivery"],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    startsAt: Date,
    expiresAt: Date,
    usageLimit: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    appliesToCustomCakes: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Coupon: Model<ICoupon> =
  (mongoose.models.Coupon as Model<ICoupon>) ||
  mongoose.model<ICoupon>("Coupon", CouponSchema);

export interface ICouponRedemption {
  _id: mongoose.Types.ObjectId;
  coupon: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  contactKey: string;
  order: mongoose.Types.ObjectId;
  discount: number;
  createdAt: Date;
}

const CouponRedemptionSchema = new Schema<ICouponRedemption>(
  {
    coupon: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    contactKey: { type: String, required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    discount: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

CouponRedemptionSchema.index({ coupon: 1, contactKey: 1 });

export const CouponRedemption: Model<ICouponRedemption> =
  (mongoose.models.CouponRedemption as Model<ICouponRedemption>) ||
  mongoose.model<ICouponRedemption>("CouponRedemption", CouponRedemptionSchema);
