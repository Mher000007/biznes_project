import mongoose, { Schema, Document } from 'mongoose';

export interface IPromoCode extends Document {
  code: string;
  plan: 'starter' | 'standard' | 'premium';
  discountType: 'percent' | 'amount' | 'free';
  discountValue: number; // e.g. 20 for percent, 5000 for AMD, 0 for free
  durationValue: number; // e.g. 1, 3
  durationUnit: 'days' | 'months' | 'permanent';
  maxUses?: number;
  usesCount: number;
  startDate?: Date;
  expiryDate?: Date;
  restrictedToBusinesses: mongoose.Types.ObjectId[];
  isActive: boolean;
  redemptions: Array<{
    business: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    redeemedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const promoCodeSchema = new Schema<IPromoCode>({
  code: {
    type: String,
    required: [true, 'Please provide a promo code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  plan: {
    type: String,
    enum: ['starter', 'standard', 'premium'],
    required: [true, 'Please select target subscription plan'],
  },
  discountType: {
    type: String,
    enum: ['percent', 'amount', 'free'],
    required: [true, 'Please select discount type'],
  },
  discountValue: {
    type: Number,
    required: true,
    default: 0,
  },
  durationValue: {
    type: Number,
    required: true,
    default: 1,
  },
  durationUnit: {
    type: String,
    enum: ['days', 'months', 'permanent'],
    required: true,
    default: 'months',
  },
  maxUses: {
    type: Number,
    default: null,
  },
  usesCount: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    default: null,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  restrictedToBusinesses: [{
    type: Schema.Types.ObjectId,
    ref: 'Business',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  redemptions: [{
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    }
  }]
}, {
  timestamps: true,
});

export default mongoose.model<IPromoCode>('PromoCode', promoCodeSchema);
