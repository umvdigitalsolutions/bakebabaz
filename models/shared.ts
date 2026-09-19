import { Schema } from "mongoose";

export const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    alt: { type: String, trim: true },
    width: Number,
    height: Number,
  },
  { _id: false },
);

export const SeoSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 320 },
  },
  { _id: false },
);

export const AddressSchema = new Schema(
  {
    label: { type: String, trim: true, default: "Home" },
    fullName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true, required: true },
    line1: { type: String, trim: true, required: true },
    line2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    pincode: { type: String, trim: true, required: true },
  },
  { _id: false },
);

export const PriceLineSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    hint: String,
  },
  { _id: false },
);
