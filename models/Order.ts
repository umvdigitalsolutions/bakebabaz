import mongoose, { Schema, type Model } from "mongoose";
import { AddressSchema, ImageSchema, PriceLineSchema } from "./shared";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type CartItemConfig,
  type ImageRef,
  type OrderStatus,
  type PaymentStatus,
  type PriceLine,
} from "@/types";

export interface IOrderItem {
  kind: "product" | "custom";
  product?: mongoose.Types.ObjectId;
  /** Frozen at purchase time — admins may rename or reprice the product later. */
  name: string;
  slug?: string;
  sku?: string;
  categoryName?: string;
  image?: ImageRef;
  config: CartItemConfig;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  breakdown: PriceLine[];
  prepTimeHours: number;
}

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  user?: mongoose.Types.ObjectId;
  contact: { name: string; phone: string; email?: string };
  items: IOrderItem[];
  delivery: {
    type: "delivery" | "pickup";
    address?: {
      label?: string;
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      landmark?: string;
      city: string;
      state: string;
      pincode: string;
    };
    date: string;
    slot: string;
    zone?: string;
    fee: number;
  };
  amounts: {
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
  };
  coupon?: { code: string; discount: number; type: string };
  payment: {
    method: "manual" | "razorpay" | "cod";
    status: PaymentStatus;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paidAt?: Date;
    failureReason?: string;
    refundId?: string;
  };
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    at: Date;
    note?: string;
    by?: string;
  }[];
  customerNotes?: string;
  internalNotes: { text: string; at: Date; by?: string }[];
  customRequest?: mongoose.Types.ObjectId;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    kind: { type: String, enum: ["product", "custom"], required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    slug: String,
    sku: String,
    categoryName: String,
    image: ImageSchema,
    config: { type: Schema.Types.Mixed, default: {} },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    breakdown: { type: [PriceLineSchema], default: [] },
    prepTimeHours: { type: Number, default: 6 },
  },
  { _id: false },
);

/**
 * Declared as its own schema because the snapshot has a field called `type`.
 * Inline, Mongoose would read that key as the path's SchemaType and silently
 * turn `coupon` into a String — so the whole object would fail to cast.
 */
const CouponSnapshotSchema = new Schema(
  {
    code: { type: String, required: true },
    discount: { type: Number, required: true, min: 0 },
    type: { type: String, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    contact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    items: { type: [OrderItemSchema], default: [] },
    delivery: {
      type: {
        type: String,
        enum: ["delivery", "pickup"],
        default: "delivery",
      },
      address: AddressSchema,
      date: { type: String, required: true },
      slot: { type: String, required: true },
      zone: String,
      fee: { type: Number, default: 0, min: 0 },
    },
    amounts: {
      subtotal: { type: Number, required: true, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    coupon: { type: CouponSnapshotSchema, default: undefined },
    payment: {
      method: {
        type: String,
        enum: ["manual", "razorpay", "cod"],
        required: true,
      },
      status: {
        type: String,
        enum: PAYMENT_STATUSES as unknown as string[],
        default: "PENDING",
      },
      razorpayOrderId: { type: String, index: true },
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date,
      failureReason: String,
      refundId: String,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES as unknown as string[],
      default: "ORDER_PLACED",
    },
    statusHistory: {
      type: [
        new Schema(
          {
            status: { type: String, required: true },
            at: { type: Date, default: Date.now },
            note: String,
            by: String,
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    customerNotes: { type: String, maxlength: 1000 },
    internalNotes: {
      type: [
        new Schema(
          {
            text: { type: String, required: true },
            at: { type: Date, default: Date.now },
            by: String,
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    customRequest: { type: Schema.Types.ObjectId, ref: "CustomCakeRequest" },
    idempotencyKey: { type: String },
  },
  { timestamps: true },
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ "delivery.date": 1, status: 1 });
OrderSchema.index({ "payment.status": 1 });
OrderSchema.index({ "contact.phone": 1 });
// A retried checkout submission reuses the same key rather than creating a twin order.
OrderSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);

export const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);
