import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  business: mongoose.Types.ObjectId;
  inquirer: mongoose.Types.ObjectId | null;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded' | 'closed';
  response?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inquirySchema = new Schema<IInquiry>({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  inquirer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['new', 'read', 'responded', 'closed'],
    default: 'new',
  },
  response: String,
  respondedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better queries
inquirySchema.index({ business: 1, status: 1 });

export default mongoose.model<IInquiry>('Inquiry', inquirySchema);
