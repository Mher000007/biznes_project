import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  recipients: mongoose.Types.ObjectId[];
  broadcast: boolean;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    broadcast: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
