import mongoose, { Schema, type Model } from "mongoose";
import { ImageSchema } from "./shared";
import type { ImageRef } from "@/types";

export interface IBanner {
  _id: mongoose.Types.ObjectId;
  title: string;
  subtitle?: string;
  desktopImage?: ImageRef;
  mobileImage?: ImageRef;
  ctaLabel?: string;
  ctaLink?: string;
  placement: "home_hero" | "home_strip" | "shop_top";
  startsAt?: Date;
  endsAt?: Date;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    desktopImage: ImageSchema,
    mobileImage: ImageSchema,
    ctaLabel: { type: String, trim: true },
    ctaLink: { type: String, trim: true },
    placement: {
      type: String,
      enum: ["home_hero", "home_strip", "shop_top"],
      default: "home_strip",
    },
    startsAt: Date,
    endsAt: Date,
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

BannerSchema.index({ active: 1, placement: 1, sortOrder: 1 });

export const Banner: Model<IBanner> =
  (mongoose.models.Banner as Model<IBanner>) ||
  mongoose.model<IBanner>("Banner", BannerSchema);
