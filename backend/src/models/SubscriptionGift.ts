import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionGift extends Document {
  business: mongoose.Types.ObjectId;
  plan: 'starter' | 'standard' | 'premium';
  durationValue: number;
  durationUnit: 'days' | 'months' | 'permanent';
  startDate: Date;
  endDate: Date;
  reason: string;
  giftedBy: mongoose.Types.ObjectId;
  actionType: 'create' | 'extend' | 'overwrite';
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionGiftSchema = new Schema<ISubscriptionGift>({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Subscription gift must belong to a business'],
  },
  plan: {
    type: String,
    enum: ['starter', 'standard', 'premium'],
    required: [true, 'Please select gifted plan'],
  },
  durationValue: {
    type: Number,
    required: true,
  },
  durationUnit: {
    type: String,
    enum: ['days', 'months', 'permanent'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason or note for the gift'],
    trim: true,
  },
  giftedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actionType: {
    type: String,
    enum: ['create', 'extend', 'overwrite'],
    required: true,
  }
}, {
  timestamps: true,
});

export default mongoose.model<ISubscriptionGift>('SubscriptionGift', subscriptionGiftSchema);
