import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  business: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  date: Date;
  timeSlot: string;
  serviceName: string;
  totalPrice: number;
  locationId?: mongoose.Types.ObjectId;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  qrToken?: string;
  webhookTriggered: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Booking must belong to a business'],
  },
  customerName: {
    type: String,
    required: [true, 'Please provide customer name'],
    trim: true,
  },
  customerPhone: {
    type: String,
    required: [true, 'Please provide customer phone number'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Please provide booking date'],
  },
  timeSlot: {
    type: String,
    required: [true, 'Please provide booking time slot'],
  },
  serviceName: {
    type: String,
    required: [true, 'Please provide service name'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Please provide total price'],
  },
  locationId: {
    type: Schema.Types.ObjectId,
    ref: 'BusinessLocation',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  qrToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  webhookTriggered: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ business: 1, date: 1 });

export default mongoose.model<IBooking>('Booking', bookingSchema);
