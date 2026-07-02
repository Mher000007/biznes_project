import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string; // e.g. 'CREATE_PROMO', 'DEACTIVATE_PROMO', 'DELETE_PROMO', 'GIFT_SUBSCRIPTION'
  performedBy: mongoose.Types.ObjectId;
  targetType: string; // e.g. 'PromoCode', 'Business'
  targetId: mongoose.Types.ObjectId;
  details?: Schema.Types.Mixed;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: {
    type: String,
    required: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  details: {
    type: Schema.Types.Mixed,
  }
}, {
  timestamps: true,
});

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
