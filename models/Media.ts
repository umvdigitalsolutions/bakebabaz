import mongoose, { Schema, type Model } from "mongoose";

export interface IMedia {
  _id: mongoose.Types.ObjectId;
  publicId: string;
  url: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  folder?: string;
  alt?: string;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    format: String,
    width: Number,
    height: Number,
    bytes: Number,
    folder: String,
    alt: String,
    uploadedBy: String,
  },
  { timestamps: true },
);

MediaSchema.index({ createdAt: -1 });

export const Media: Model<IMedia> =
  (mongoose.models.Media as Model<IMedia>) ||
  mongoose.model<IMedia>("Media", MediaSchema);
