import mongoose, { Schema, type Model } from "mongoose";
import { ImageSchema, SeoSchema } from "./shared";
import type { ImageRef } from "@/types";

export type WeightVariant = {
  label: string;
  grams: number;
  price: number;
  salePrice?: number;
  stock?: number;
  sku?: string;
  servings?: string;
};

export type ProductOption = {
  name: string;
  surcharge: number;
  premium?: boolean;
};

export interface IProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  sku?: string;
  category: mongoose.Types.ObjectId;
  shortDescription?: string;
  description?: string;
  images: ImageRef[];
  basePrice: number;
  salePrice?: number;
  weights: WeightVariant[];
  flavours: ProductOption[];
  fillings: ProductOption[];
  shapes: ProductOption[];
  eggOptions: ("eggless" | "with-egg")[];
  addOns: mongoose.Types.ObjectId[];
  tags: string[];
  occasions: string[];
  stock: number;
  unlimitedStock: boolean;
  lowStockThreshold: number;
  customisable: boolean;
  allowMessage: boolean;
  featured: boolean;
  bestseller: boolean;
  isVegetarian: boolean;
  ingredients?: string;
  allergens?: string;
  storageInstructions?: string;
  deliveryInfo?: string;
  prepTimeHours: number;
  seo?: { title?: string; description?: string };
  status: "active" | "draft" | "archived";
  rating: { average: number; count: number };
  sortOrder: number;
  salesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WeightVariantSchema = new Schema<WeightVariant>(
  {
    label: { type: String, required: true, trim: true },
    grams: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stock: { type: Number, min: 0 },
    sku: { type: String, trim: true },
    servings: { type: String, trim: true },
  },
  { _id: false },
);

const ProductOptionSchema = new Schema<ProductOption>(
  {
    name: { type: String, required: true, trim: true },
    surcharge: { type: Number, default: 0, min: 0 },
    premium: { type: Boolean, default: false },
  },
  { _id: false },
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    sku: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    shortDescription: { type: String, trim: true, maxlength: 400 },
    description: { type: String, trim: true, maxlength: 6000 },
    images: { type: [ImageSchema], default: [] },
    basePrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    weights: { type: [WeightVariantSchema], default: [] },
    flavours: { type: [ProductOptionSchema], default: [] },
    fillings: { type: [ProductOptionSchema], default: [] },
    shapes: { type: [ProductOptionSchema], default: [] },
    eggOptions: {
      type: [String],
      enum: ["eggless", "with-egg"],
      default: ["eggless"],
    },
    addOns: [{ type: Schema.Types.ObjectId, ref: "AddOn" }],
    tags: { type: [String], default: [] },
    occasions: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    unlimitedStock: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 5 },
    customisable: { type: Boolean, default: true },
    allowMessage: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    isVegetarian: { type: Boolean, default: true },
    ingredients: { type: String, trim: true },
    allergens: { type: String, trim: true },
    storageInstructions: { type: String, trim: true },
    deliveryInfo: { type: String, trim: true },
    prepTimeHours: { type: Number, default: 6, min: 0 },
    seo: SeoSchema,
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    sortOrder: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ProductSchema.index({ status: 1, category: 1, sortOrder: 1 });
ProductSchema.index({ status: 1, featured: -1 });
ProductSchema.index({ status: 1, bestseller: -1, salesCount: -1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index(
  { name: "text", shortDescription: "text", tags: "text", occasions: "text" },
  {
    weights: { name: 10, tags: 5, occasions: 3, shortDescription: 1 },
    name: "product_search",
  },
);

export const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);
