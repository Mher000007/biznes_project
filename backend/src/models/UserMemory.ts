import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMemory extends Document {
  user: mongoose.Types.ObjectId;
  preference: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userMemorySchema = new Schema<IUserMemory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    preference: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'general',
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUserMemory>('UserMemory', userMemorySchema);
