import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  conversationId: string;
  sender: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  attachments?: string[];
  read: boolean;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  conversationId: {
    type: String,
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  attachments: [String],
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better queries
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
