import mongoose, { Schema, type Model } from "mongoose";
import type { PriceModifierKind } from "@/types";

/**
 * Named, admin-editable pricing knobs the custom cake engine reads at
 * calculation time. Nothing about price lives in a React component.
 */
export interface IPricingRule {
  _id: mongoose.Types.ObjectId;
  code: string;
  label: string;
  kind: PriceModifierKind;
  amount: number;
  description?: string;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    code: { type: String, required: true, trim: true, unique: true },
    label: { type: String, required: true, trim: true },
    kind: {
      type: String,
      enum: ["flat", "per_kg", "percent"],
      default: "flat",
    },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const PricingRule: Model<IPricingRule> =
  (mongoose.models.PricingRule as Model<IPricingRule>) ||
  mongoose.model<IPricingRule>("PricingRule", PricingRuleSchema);
