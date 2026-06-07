import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
  business: mongoose.Types.ObjectId;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
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
