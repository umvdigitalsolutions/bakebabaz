import mongoose, { Schema, type Model } from "mongoose";
import { ImageSchema } from "./shared";
import type { CustomizationType, ImageRef, PriceModifierKind } from "@/types";
import { CUSTOMIZATION_TYPES } from "@/types";

export interface ICustomizationOption {
  _id: mongoose.Types.ObjectId;
  type: CustomizationType;
  label: string;
  value: string;
  description?: string;
  image?: ImageRef;
  /** How this choice changes the price: a flat add-on, a per-kg rate, or a % of base. */
  modifierKind: PriceModifierKind;
  modifierAmount: number;
  /** For type `weight`: the kilogram value the option represents. */
  numericValue?: number;
  /** Extra lead time this choice demands, in hours. */
  extraPrepHours: number;
  badge?: string;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomizationOptionSchema = new Schema<ICustomizationOption>(
  {
    type: {
      type: String,
      enum: CUSTOMIZATION_TYPES as unknown as string[],
      required: true,
    },
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 300 },
    image: ImageSchema,
    modifierKind: {
      type: String,
      enum: ["flat", "per_kg", "percent"],
      default: "flat",
    },
    modifierAmount: { type: Number, default: 0 },
    numericValue: Number,
    extraPrepHours: { type: Number, default: 0, min: 0 },
    badge: { type: String, trim: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CustomizationOptionSchema.index({ type: 1, value: 1 }, { unique: true });
CustomizationOptionSchema.index({ type: 1, active: 1, sortOrder: 1 });

export const CustomizationOption: Model<ICustomizationOption> =
  (mongoose.models.CustomizationOption as Model<ICustomizationOption>) ||
  mongoose.model<ICustomizationOption>(
    "CustomizationOption",
    CustomizationOptionSchema,
  );
