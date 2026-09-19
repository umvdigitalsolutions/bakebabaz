import mongoose, { Schema, type Model } from "mongoose";

export interface IDeliverySlot {
  _id: mongoose.Types.ObjectId;
  label: string;
  /** 24h "HH:mm" — used to test the lead-time window against the order date. */
  startTime: string;
  endTime: string;
  surcharge: number;
  maxOrders: number;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySlotSchema = new Schema<IDeliverySlot>(
  {
    label: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    surcharge: { type: Number, default: 0, min: 0 },
    maxOrders: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

DeliverySlotSchema.index({ active: 1, sortOrder: 1 });

export const DeliverySlot: Model<IDeliverySlot> =
  (mongoose.models.DeliverySlot as Model<IDeliverySlot>) ||
  mongoose.model<IDeliverySlot>("DeliverySlot", DeliverySlotSchema);
