import mongoose, { Schema, type Model } from "mongoose";
import { ImageSchema, SeoSchema } from "./shared";
import type { ImageRef } from "@/types";

export interface ICategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: ImageRef;
  icon?: string;
  seo?: { title?: string; description?: string };
  active: boolean;
  featured: boolean;
  sortOrder: number;
  /** Minimum lead time for anything in this category, in hours. */
  prepTimeHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: { type: String, trim: true, maxlength: 600 },
    image: ImageSchema,
    icon: { type: String, trim: true },
    seo: SeoSchema,
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    prepTimeHours: { type: Number, default: 6, min: 0 },
  },
  { timestamps: true },
);

CategorySchema.index({ active: 1, sortOrder: 1 });

export const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory>) ||
  mongoose.model<ICategory>("Category", CategorySchema);
