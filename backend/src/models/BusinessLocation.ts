import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessLocation extends Document {
  business: mongoose.Types.ObjectId;
  name: string;
  address: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  workingHours?: string;
  isPrimary: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const businessLocationSchema = new Schema<IBusinessLocation>({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a location name (e.g. Headquarters)'],
    trim: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  phone: String,
  workingHours: String,
  isPrimary: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a business can only have one primary location, although logic in controller will enforce it
businessLocationSchema.index({ business: 1 });

export default mongoose.model<IBusinessLocation>('BusinessLocation', businessLocationSchema);
