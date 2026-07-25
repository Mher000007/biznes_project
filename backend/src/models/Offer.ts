import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  business: mongoose.Types.ObjectId;
  packageName: string;
  dishes: string[];
  dishesEn?: string[];
  dishesRu?: string[];
  pax: number;
  price: number;
  inclusions: string[];
  location: string;
  atmosphere?: string;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    packageName: {
      type: String,
      required: [true, 'Please provide a package name'],
      trim: true,
    },
    dishes: {
      type: [String],
      default: [],
    },
    dishesEn: {
      type: [String],
      default: [],
    },
    dishesRu: {
      type: [String],
      default: [],
    },
    pax: {
      type: Number,
      required: [true, 'Please specify the number of people (pax)'],
      min: 1,
    },
    price: {
      type: Number,
      required: [true, 'Please provide the package price'],
      min: 0,
    },
    inclusions: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Please provide the exact location for this offer'],
    },
    atmosphere: {
      type: String,
      default: 'family',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast AI assistant search & multi-field filtering
offerSchema.index({ business: 1 });
offerSchema.index({ pax: 1, price: 1, atmosphere: 1 });
offerSchema.index({
  packageName: 'text',
  dishes: 'text',
  dishesEn: 'text',
  dishesRu: 'text',
  inclusions: 'text',
  location: 'text',
  atmosphere: 'text',
});

export default mongoose.model<IOffer>('Offer', offerSchema);
