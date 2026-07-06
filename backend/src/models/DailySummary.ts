import mongoose, { Schema, Document } from 'mongoose';

export interface IDailySummary extends Document {
  business: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  summary: string;
  stats?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const dailySummarySchema = new Schema<IDailySummary>({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    default: '',
  },
  stats: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

// Ensure one summary per business per date
dailySummarySchema.index({ business: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailySummary>('DailySummary', dailySummarySchema);
