import mongoose, { Schema, type Model } from "mongoose";

export interface IReview {
  _id: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  approved: boolean;
  adminReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    customerName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    verifiedPurchase: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    adminReply: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

ReviewSchema.index({ product: 1, approved: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const Review: Model<IReview> =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>("Review", ReviewSchema);
