import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IScanLog extends Document {
  visitId: Types.ObjectId;
  scannedBy: Types.ObjectId;
  result: 'SUCCESS' | 'INVALID' | 'EXPIRED' | 'ALREADY_USED' | 'NOT_APPROVED';
  deviceInfo?: string;
  createdAt: Date;
}

const scanLogSchema = new Schema<IScanLog>(
  {
    visitId:    { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    scannedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    result:     {
      type: String,
      enum: ['SUCCESS', 'INVALID', 'EXPIRED', 'ALREADY_USED', 'NOT_APPROVED'],
      required: true,
    },
    deviceInfo: { type: String },
  },
  { timestamps: true }
);

export const ScanLog = mongoose.model<IScanLog>('ScanLog', scanLogSchema);