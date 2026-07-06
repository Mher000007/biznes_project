import mongoose, { Schema, Document } from 'mongoose';

export interface IPageVisit extends Document {
  business: mongoose.Types.ObjectId;
  timestamp: Date;
}

const pageVisitSchema = new Schema<IPageVisit>({
  business: { 
    type: Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true,
    index: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
});

export default mongoose.model<IPageVisit>('PageVisit', pageVisitSchema);
