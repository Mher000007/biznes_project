import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d', // TTL index to clean up old documents automatically after 30 days
  },
});

export default mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
