import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
  business: mongoose.Types.ObjectId;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  cta?: { type: string; link?: string };
  scheduledFor?: Date;
  interactiveElements?: any[];
  overlay?: { text?: string; font?: string; color?: string; badge?: string; position?: { x: number; y: number } };
  stats: {
    clicks: number;
    saves: number;
    reactions: number;
  };
  views: string[];
  createdAt: Date;
  expiresAt: Date;
}

const storySchema = new Schema<IStory>({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image',
  },
  caption: {
    type: String,
    trim: true,
  },
  cta: {
    type: {
      type: String,
      enum: ['none', 'book', 'buy', 'call', 'menu', 'custom'],
      default: 'none'
    },
    link: String
  },
  scheduledFor: {
    type: Date
  },
  interactiveElements: {
    type: Schema.Types.Mixed,
    default: []
  },
  overlay: {
    type: Schema.Types.Mixed
  },
  stats: {
    clicks: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    reactions: { type: Number, default: 0 }
  },
  views: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

storySchema.index({ expiresAt: 1 });
storySchema.index({ business: 1 });

export default mongoose.model<IStory>('Story', storySchema);
