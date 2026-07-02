import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  business: mongoose.Types.ObjectId;
  plan: 'starter' | 'standard' | 'premium';
  price: number; // in AMD
  commissionRate: number; // in percentage
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  isGifted?: boolean;
  giftReason?: string;
  promoCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Subscription must belong to a business'],
    unique: true,
  },
  plan: {
    type: String,
    enum: ['starter', 'standard', 'premium'],
    required: [true, 'Please select a subscription plan'],
  },
  price: {
    type: Number,
    required: true,
  },
  commissionRate: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isGifted: {
    type: Boolean,
    default: false,
  },
  giftReason: {
    type: String,
    default: null,
  },
  promoCode: {
    type: String,
    default: null,
  }
}, {
  timestamps: true
});

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);
