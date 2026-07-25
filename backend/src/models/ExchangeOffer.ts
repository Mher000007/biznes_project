import mongoose, { Schema, Document } from 'mongoose';

export interface IExchangeOffer extends Document {
  business: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  cost: number;
  totalQuantity: number;
  claimedQuantity: number;
  isActive: boolean;
  image?: string;
  imageUrl?: string;
  savedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const exchangeOfferSchema = new Schema<IExchangeOffer>(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an offer title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide an offer description'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
    },
    cost: {
      type: Number,
      required: [true, 'Please specify the cost in Findy Coins'],
      min: 0,
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Please specify the total quantity available'],
      min: 1,
    },
    claimedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    savedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

exchangeOfferSchema.index({ business: 1 });
exchangeOfferSchema.index({ isActive: 1 });

export default mongoose.model<IExchangeOffer>('ExchangeOffer', exchangeOfferSchema);
