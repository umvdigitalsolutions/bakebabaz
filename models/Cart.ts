import mongoose, { Schema, type Model } from "mongoose";
import { ImageSchema } from "./shared";
import type { CartItemConfig, ImageRef } from "@/types";

export interface ICartItem {
  key: string;
  kind: "product" | "custom";
  product?: mongoose.Types.ObjectId;
  name: string;
  slug?: string;
  categoryName?: string;
  image?: ImageRef;
  config: CartItemConfig;
  quantity: number;
  requiredDate?: string;
  deliverySlot?: string;
  savedForLater: boolean;
}

export interface ICart {
  _id: mongoose.Types.ObjectId;
  token: string;
  user?: mongoose.Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddOnLineSchema = new Schema(
  {
    id: String,
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const CartItemConfigSchema = new Schema(
  {
    weightLabel: String,
    weightGrams: Number,
    flavour: String,
    filling: String,
    shape: String,
    style: String,
    eggPreference: { type: String, enum: ["eggless", "with-egg"] },
    message: { type: String, maxlength: 120 },
    tiers: Number,
    colourTheme: { type: String, maxlength: 300 },
    servings: Number,
    occasion: String,
    addOns: { type: [AddOnLineSchema], default: [] },
    referenceImages: { type: [ImageSchema], default: [] },
    notes: { type: String, maxlength: 1000 },
  },
  { _id: false },
);

const CartItemSchema = new Schema<ICartItem>(
  {
    key: { type: String, required: true },
    kind: { type: String, enum: ["product", "custom"], required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    slug: String,
    categoryName: String,
    image: ImageSchema,
    config: { type: CartItemConfigSchema, default: {} },
    quantity: { type: Number, default: 1, min: 1, max: 50 },
    requiredDate: String,
    deliverySlot: String,
    savedForLater: { type: Boolean, default: false },
  },
  { _id: false },
);

/**
 * Carts hold *configuration only*. Prices are recomputed from the database on
 * every read, so a tampered client can never influence what is charged.
 */
const CartSchema = new Schema<ICart>(
  {
    token: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    items: { type: [CartItemSchema], default: [] },
    couponCode: { type: String, uppercase: true, trim: true },
  },
  { timestamps: true },
);

CartSchema.index({ user: 1 });
// Abandoned carts clean themselves up after 60 days.
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

export const Cart: Model<ICart> =
  (mongoose.models.Cart as Model<ICart>) ||
  mongoose.model<ICart>("Cart", CartSchema);
