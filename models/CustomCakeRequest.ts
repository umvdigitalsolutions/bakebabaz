import mongoose, { Schema, type Model } from "mongoose";
import { ImageSchema, PriceLineSchema } from "./shared";
import {
  CUSTOM_REQUEST_STATUSES,
  type CustomRequestStatus,
  type ImageRef,
  type PriceLine,
} from "@/types";

export interface ICustomCakeRequest {
  _id: mongoose.Types.ObjectId;
  requestNumber: string;
  user?: mongoose.Types.ObjectId;
  contact: { name: string; phone: string; email?: string };
  celebration: {
    occasion: string;
    requiredDate: string;
    deliverySlot?: string;
    servings?: number;
  };
  cake: {
    style?: string;
    flavour?: string;
    filling?: string;
    shape?: string;
    weightKg: number;
    eggPreference: "eggless" | "with-egg";
    tiers: number;
    colourTheme?: string;
    message?: string;
    addOns: { id?: string; name: string; price: number }[];
  };
  referenceImages: ImageRef[];
  notes?: string;
  estimate: { lineItems: PriceLine[]; total: number };
  quote?: { amount: number; note?: string; quotedAt: Date; quotedBy?: string };
  status: CustomRequestStatus;
  statusHistory: {
    status: CustomRequestStatus;
    at: Date;
    note?: string;
    by?: string;
  }[];
  internalNotes: { text: string; at: Date; by?: string }[];
  customerNotes: { text: string; at: Date; by?: string }[];
  order?: mongoose.Types.ObjectId;
  /** Signed token used by the approval-mode payment link. */
  paymentToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomCakeRequestSchema = new Schema<ICustomCakeRequest>(
  {
    requestNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    contact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    celebration: {
      occasion: { type: String, required: true },
      requiredDate: { type: String, required: true },
      deliverySlot: String,
      servings: Number,
    },
    cake: {
      style: String,
      flavour: String,
      filling: String,
      shape: String,
      weightKg: { type: Number, required: true, min: 0.5 },
      eggPreference: {
        type: String,
        enum: ["eggless", "with-egg"],
        default: "eggless",
      },
      tiers: { type: Number, default: 1, min: 1, max: 6 },
      colourTheme: { type: String, maxlength: 300 },
      message: { type: String, maxlength: 120 },
      addOns: {
        type: [
          new Schema(
            { id: String, name: String, price: Number },
            { _id: false },
          ),
        ],
        default: [],
      },
    },
    referenceImages: { type: [ImageSchema], default: [] },
    notes: { type: String, maxlength: 2000 },
    estimate: {
      lineItems: { type: [PriceLineSchema], default: [] },
      total: { type: Number, default: 0 },
    },
    quote: {
      amount: Number,
      note: String,
      quotedAt: Date,
      quotedBy: String,
    },
    status: {
      type: String,
      enum: CUSTOM_REQUEST_STATUSES as unknown as string[],
      default: "NEW",
    },
    statusHistory: {
      type: [
        new Schema(
          {
            status: String,
            at: { type: Date, default: Date.now },
            note: String,
            by: String,
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    internalNotes: {
      type: [
        new Schema(
          { text: String, at: { type: Date, default: Date.now }, by: String },
          { _id: false },
        ),
      ],
      default: [],
    },
    customerNotes: {
      type: [
        new Schema(
          { text: String, at: { type: Date, default: Date.now }, by: String },
          { _id: false },
        ),
      ],
      default: [],
    },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    paymentToken: { type: String, index: true },
  },
  { timestamps: true },
);

CustomCakeRequestSchema.index({ status: 1, createdAt: -1 });
CustomCakeRequestSchema.index({ user: 1, createdAt: -1 });
CustomCakeRequestSchema.index({ "celebration.requiredDate": 1 });

export const CustomCakeRequest: Model<ICustomCakeRequest> =
  (mongoose.models.CustomCakeRequest as Model<ICustomCakeRequest>) ||
  mongoose.model<ICustomCakeRequest>(
    "CustomCakeRequest",
    CustomCakeRequestSchema,
  );
