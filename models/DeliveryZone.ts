import mongoose, { Schema, type Model } from "mongoose";

export interface IDeliveryZone {
  _id: mongoose.Types.ObjectId;
  pincode: string;
  area: string;
  fee: number;
  minOrder: number;
  freeAbove?: number;
  sameDayAvailable: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryZoneSchema = new Schema<IDeliveryZone>(
  {
    pincode: { type: String, required: true, trim: true, unique: true },
    area: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    freeAbove: { type: Number, min: 0 },
    sameDayAvailable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

DeliveryZoneSchema.index({ active: 1, pincode: 1 });

export const DeliveryZone: Model<IDeliveryZone> =
  (mongoose.models.DeliveryZone as Model<IDeliveryZone>) ||
  mongoose.model<IDeliveryZone>("DeliveryZone", DeliveryZoneSchema);
