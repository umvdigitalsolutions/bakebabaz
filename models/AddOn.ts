import mongoose, { Schema, type Model } from "mongoose";
import { ImageSchema } from "./shared";
import type { ImageRef } from "@/types";

export interface IAddOn {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  image?: ImageRef;
  group: string;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const AddOnSchema = new Schema<IAddOn>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 300 },
    price: { type: Number, required: true, min: 0 },
    image: ImageSchema,
    group: { type: String, trim: true, default: "Extras" },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

AddOnSchema.index({ active: 1, sortOrder: 1 });

export const AddOn: Model<IAddOn> =
  (mongoose.models.AddOn as Model<IAddOn>) ||
  mongoose.model<IAddOn>("AddOn", AddOnSchema);
